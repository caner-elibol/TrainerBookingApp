using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Common;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Trainers;

public class AvailabilityService : IAvailabilityService
{
    private readonly AppDbContext _db;

    public AvailabilityService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AvailableSlotDto>?> GetAvailableSlotsAsync(Guid trainerId, Guid locationId, DateOnly date, CancellationToken ct = default)
    {
        var setting = await _db.TrainerSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.TrainerId == trainerId, ct);
        if (setting is null)
            return null;

        var isClosed = await _db.TrainerClosedDays.AsNoTracking()
            .AnyAsync(d => d.TrainerId == trainerId && d.Date == date, ct);
        if (isClosed)
            return Array.Empty<AvailableSlotDto>();

        if (date > IstanbulClock.TodayIstanbul().AddDays(6))
            return Array.Empty<AvailableSlotDto>();

        var workingHours = await _db.TrainerWorkingHours.AsNoTracking()
            .FirstOrDefaultAsync(w => w.TrainerId == trainerId && w.DayOfWeek == date.DayOfWeek, ct);
        if (workingHours is null)
            return Array.Empty<AvailableSlotDto>();

        var locationExists = await _db.TrainerLocations.AsNoTracking()
            .AnyAsync(l => l.Id == locationId && l.TrainerId == trainerId, ct);
        if (!locationExists)
            return Array.Empty<AvailableSlotDto>();

        var istanbulMidnightLocal = date.ToDateTime(TimeOnly.MinValue);
        var dayStartUtc = IstanbulClock.ConvertLocalToUtc(istanbulMidnightLocal);
        var dayEndUtc = IstanbulClock.ConvertLocalToUtc(istanbulMidnightLocal.AddDays(1));

        var dayAppointments = await _db.Appointments.AsNoTracking()
            .Where(a => a.TrainerId == trainerId
                && a.StartTime >= dayStartUtc && a.StartTime < dayEndUtc
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.StartTime)
            .Select(a => new { a.StartTime, a.EndTime, a.LocationId })
            .ToListAsync(ct);

        var travelTimes = dayAppointments.Count == 0
            ? new List<LocationTravelTime>()
            : await _db.LocationTravelTimes.AsNoTracking()
                .Where(t => t.TrainerId == trainerId)
                .ToListAsync(ct);

        int GapMinutesTo(Guid otherLocationId) =>
            otherLocationId == locationId
                ? setting.BufferDurationMinutes
                : travelTimes.FirstOrDefault(t =>
                        (t.LocationAId == otherLocationId && t.LocationBId == locationId) ||
                        (t.LocationBId == otherLocationId && t.LocationAId == locationId))
                    ?.Minutes ?? setting.BufferDurationMinutes;

        var sessionLength = TimeSpan.FromMinutes(setting.SessionDurationMinutes);
        var blockLength = TimeSpan.FromMinutes(setting.SessionDurationMinutes + setting.BufferDurationMinutes);

        var slots = new List<AvailableSlotDto>();
        var current = workingHours.StartTime;

        while (current + sessionLength <= workingHours.EndTime)
        {
            if (workingHours.BreakStartTime.HasValue && workingHours.BreakEndTime.HasValue
                && current < workingHours.BreakEndTime.Value
                && current + sessionLength > workingHours.BreakStartTime.Value)
            {
                current = workingHours.BreakEndTime.Value;
                continue;
            }

            var slotStartLocal = istanbulMidnightLocal.Add(current);
            var slotStartUtc = IstanbulClock.ConvertLocalToUtc(slotStartLocal);
            var slotEndUtc = slotStartUtc.Add(sessionLength);

            DateTime? pushToUtc = null;
            foreach (var appt in dayAppointments)
            {
                var gap = TimeSpan.FromMinutes(GapMinutesTo(appt.LocationId));
                var blockedFromUtc = appt.StartTime - gap;
                var blockedUntilUtc = appt.EndTime + gap;

                if (slotStartUtc < blockedUntilUtc && slotEndUtc > blockedFromUtc)
                {
                    if (pushToUtc is null || blockedUntilUtc > pushToUtc)
                        pushToUtc = blockedUntilUtc;
                }
            }

            if (pushToUtc.HasValue)
            {
                var pushedLocal = IstanbulClock.ConvertUtcToLocal(pushToUtc.Value);
                if (DateOnly.FromDateTime(pushedLocal) != date)
                    break;

                current = pushedLocal.TimeOfDay;
                continue;
            }

            if (slotStartUtc >= DateTime.UtcNow)
                slots.Add(new AvailableSlotDto(slotStartUtc, slotEndUtc));

            current = current.Add(blockLength);
        }

        return slots;
    }

    public async Task<IReadOnlyList<BusySlotDto>> GetBusySlotsAsync(Guid trainerId, DateOnly date, CancellationToken ct = default)
    {
        var setting = await _db.TrainerSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.TrainerId == trainerId, ct);
        if (setting is null)
            return Array.Empty<BusySlotDto>();

        var istanbulMidnightLocal = date.ToDateTime(TimeOnly.MinValue);
        var dayStartUtc = IstanbulClock.ConvertLocalToUtc(istanbulMidnightLocal);
        var dayEndUtc = IstanbulClock.ConvertLocalToUtc(istanbulMidnightLocal.AddDays(1));

        return await _db.Appointments.AsNoTracking()
            .Where(a => a.TrainerId == trainerId
                && a.StartTime >= dayStartUtc && a.StartTime < dayEndUtc
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.StartTime)
            .Select(a => new BusySlotDto(a.StartTime, a.EndTime))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ClosedDayDto>> GetClosedDaysAsync(Guid trainerId, DateOnly from, DateOnly to, CancellationToken ct = default) =>
        await _db.TrainerClosedDays.AsNoTracking()
            .Where(d => d.TrainerId == trainerId && d.Date >= from && d.Date <= to)
            .OrderBy(d => d.Date)
            .Select(d => new ClosedDayDto(d.Date, d.Reason))
            .ToListAsync(ct);

    public async Task SetDayClosedAsync(Guid trainerId, DateOnly date, bool closed, TrainerClosedDayReason reason = TrainerClosedDayReason.Manual, CancellationToken ct = default)
    {
        var existing = await _db.TrainerClosedDays
            .FirstOrDefaultAsync(d => d.TrainerId == trainerId && d.Date == date, ct);

        if (closed && existing is null)
            _db.TrainerClosedDays.Add(new TrainerClosedDay { TrainerId = trainerId, Date = date, Reason = reason });
        else if (!closed && existing is not null)
            _db.TrainerClosedDays.Remove(existing);
        else
            return;

        await _db.SaveChangesAsync(ct);
    }
}
