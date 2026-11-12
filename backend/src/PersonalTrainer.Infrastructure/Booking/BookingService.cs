using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Booking;
using PersonalTrainer.Application.Locking;
using PersonalTrainer.Application.Notifications;
using PersonalTrainer.Application.Realtime;
using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Common;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Booking;

public class BookingService : IBookingService
{
    private static readonly TimeSpan LockTtl = TimeSpan.FromMinutes(1);

    private readonly AppDbContext _db;
    private readonly IReservationLockService _lockService;
    private readonly IAvailabilityService _availabilityService;
    private readonly IAvailabilityNotifier _notifier;
    private readonly INotificationService _notificationService;

    public BookingService(
        AppDbContext db,
        IReservationLockService lockService,
        IAvailabilityService availabilityService,
        IAvailabilityNotifier notifier,
        INotificationService notificationService)
    {
        _db = db;
        _lockService = lockService;
        _availabilityService = availabilityService;
        _notifier = notifier;
        _notificationService = notificationService;
    }

    public async Task<LockAppointmentResult> LockSlotAsync(Guid clientId, LockAppointmentRequest request, CancellationToken ct = default)
    {
        var userPackage = await _db.UserPackages
            .Include(p => p.Package)
            .FirstOrDefaultAsync(p => p.Id == request.UserPackageId && p.ClientId == clientId, ct);

        if (userPackage is null)
            return new LockAppointmentResult(false, "Package not found.", null, null);

        if (userPackage.Package.TrainerId != request.TrainerId)
            return new LockAppointmentResult(false, "This package is not valid for the selected trainer.", null, null);

        if (!userPackage.IsActive || userPackage.RemainingSessions <= 0)
            return new LockAppointmentResult(false, "No remaining sessions on this package.", null, null);

        var date = DateOnly.FromDateTime(request.StartTimeUtc);
        var availableSlots = await _availabilityService.GetAvailableSlotsAsync(request.TrainerId, request.LocationId, date, ct);
        if (availableSlots is null || availableSlots.All(s => s.StartTimeUtc != request.StartTimeUtc))
            return new LockAppointmentResult(false, "That slot is not available.", null, null);

        var acquired = await _lockService.TryAcquireLockAsync(request.TrainerId, request.StartTimeUtc, LockTtl, ct);
        if (!acquired)
            return new LockAppointmentResult(false, "That slot is currently being reserved by someone else.", null, null);

        var setting = await _db.TrainerSettings.AsNoTracking().FirstAsync(s => s.TrainerId == request.TrainerId, ct);
        var lockExpiration = DateTime.UtcNow.Add(LockTtl);

        var appointment = new Appointment
        {
            TrainerId = request.TrainerId,
            ClientId = clientId,
            UserPackageId = request.UserPackageId,
            LocationId = request.LocationId,
            StartTime = request.StartTimeUtc,
            EndTime = request.StartTimeUtc.AddMinutes(setting.SessionDurationMinutes),
            Status = AppointmentStatus.Locked,
            LockExpirationTime = lockExpiration,
        };

        _db.Appointments.Add(appointment);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            await _lockService.ReleaseLockAsync(request.TrainerId, request.StartTimeUtc, ct);
            return new LockAppointmentResult(false, "That slot was just taken.", null, null);
        }

        await _notifier.NotifySlotStatusChangedAsync(
            new SlotStatusChangedMessage(request.TrainerId, request.StartTimeUtc, SlotStatus.Selecting), ct);

        return new LockAppointmentResult(true, null, appointment.Id, lockExpiration);
    }

    public async Task<ConfirmAppointmentResult> ConfirmAsync(Guid clientId, Guid appointmentId, CancellationToken ct = default)
    {
        var appointment = await _db.Appointments
            .Include(a => a.UserPackage)
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.ClientId == clientId, ct);

        if (appointment is null)
            return new ConfirmAppointmentResult(false, "Appointment not found.");

        if (appointment.Status != AppointmentStatus.Locked)
            return new ConfirmAppointmentResult(false, "Appointment is not in a pending state.");

        if (appointment.LockExpirationTime < DateTime.UtcNow)
        {
            appointment.Status = AppointmentStatus.Cancelled;
            await _db.SaveChangesAsync(ct);

            await _lockService.ReleaseLockAsync(appointment.TrainerId, appointment.StartTime, ct);
            await _notifier.NotifySlotStatusChangedAsync(
                new SlotStatusChangedMessage(appointment.TrainerId, appointment.StartTime, SlotStatus.Available), ct);

            return new ConfirmAppointmentResult(false, "Reservation lock expired.");
        }

        if (appointment.UserPackage.RemainingSessions <= 0)
            return new ConfirmAppointmentResult(false, "No remaining sessions on this package.");

        appointment.Status = AppointmentStatus.Confirmed;
        appointment.UserPackage.RemainingSessions -= 1;

        await _notificationService.AppointmentCreatedAsync(
            appointment.TrainerId, clientId, appointment.StartTime, appointment.UserPackage.RemainingSessions, ct);

        await _db.SaveChangesAsync(ct);
        await _lockService.ReleaseLockAsync(appointment.TrainerId, appointment.StartTime, ct);

        await _notifier.NotifySlotStatusChangedAsync(
            new SlotStatusChangedMessage(appointment.TrainerId, appointment.StartTime, SlotStatus.Booked), ct);

        return new ConfirmAppointmentResult(true, null);
    }

    public async Task<ReleaseAppointmentResult> ReleaseAsync(Guid clientId, Guid appointmentId, CancellationToken ct = default)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.ClientId == clientId, ct);

        if (appointment is null)
            return new ReleaseAppointmentResult(false, "Appointment not found.");

        if (appointment.Status != AppointmentStatus.Locked)
            return new ReleaseAppointmentResult(false, "Only a pending reservation can be released.");

        appointment.Status = AppointmentStatus.Cancelled;
        await _db.SaveChangesAsync(ct);

        await _lockService.ReleaseLockAsync(appointment.TrainerId, appointment.StartTime, ct);
        await _notifier.NotifySlotStatusChangedAsync(
            new SlotStatusChangedMessage(appointment.TrainerId, appointment.StartTime, SlotStatus.Available), ct);

        return new ReleaseAppointmentResult(true, null);
    }

    public async Task<CancelAppointmentResult> CancelAsync(Guid userId, Guid appointmentId, bool refundSession = true, CancellationToken ct = default)
    {
        var appointment = await _db.Appointments
            .Include(a => a.UserPackage)
            .FirstOrDefaultAsync(a => a.Id == appointmentId && (a.ClientId == userId || a.TrainerId == userId), ct);

        if (appointment is null)
            return new CancelAppointmentResult(false, "Appointment not found.");

        if (appointment.Status != AppointmentStatus.Confirmed)
            return new CancelAppointmentResult(false, "Only a confirmed appointment can be cancelled.");

        var isTrainer = appointment.TrainerId == userId;

        if (isTrainer)
        {
            if (appointment.StartTime <= DateTime.UtcNow)
                return new CancelAppointmentResult(false, "A past appointment can no longer be cancelled.");
        }
        else if ((appointment.StartTime - DateTime.UtcNow).TotalHours < 12)
        {
            return new CancelAppointmentResult(false, "Appointments can only be cancelled at least 12 hours in advance.");
        }

        appointment.Status = AppointmentStatus.Cancelled;

        var sessionRefunded = !isTrainer || refundSession;
        if (sessionRefunded)
            appointment.UserPackage.RemainingSessions += 1;

        await _notificationService.AppointmentCancelledAsync(
            appointment.TrainerId, appointment.ClientId, appointment.StartTime,
            cancelledByTrainer: isTrainer, sessionRefunded, ct);

        await _db.SaveChangesAsync(ct);

        await _notifier.NotifySlotStatusChangedAsync(
            new SlotStatusChangedMessage(appointment.TrainerId, appointment.StartTime, SlotStatus.Available), ct);

        return new CancelAppointmentResult(true, null);
    }

    public async Task<BookForClientResult> BookForClientAsync(Guid trainerId, BookForClientRequest request, CancellationToken ct = default)
    {
        var userPackage = await _db.UserPackages
            .Include(p => p.Package)
            .FirstOrDefaultAsync(p => p.Id == request.UserPackageId && p.ClientId == request.ClientId, ct);

        if (userPackage is null)
            return new BookForClientResult(false, "Package not found.", null);

        if (userPackage.Package.TrainerId != trainerId)
            return new BookForClientResult(false, "This package is not valid for this trainer.", null);

        if (!userPackage.IsActive || userPackage.RemainingSessions <= 0)
            return new BookForClientResult(false, "No remaining sessions on this package.", null);

        var date = DateOnly.FromDateTime(request.StartTimeUtc);
        var availableSlots = await _availabilityService.GetAvailableSlotsAsync(trainerId, request.LocationId, date, ct);
        if (availableSlots is null || availableSlots.All(s => s.StartTimeUtc != request.StartTimeUtc))
            return new BookForClientResult(false, "That slot is not available.", null);

        var setting = await _db.TrainerSettings.AsNoTracking().FirstAsync(s => s.TrainerId == trainerId, ct);

        var appointment = new Appointment
        {
            TrainerId = trainerId,
            ClientId = request.ClientId,
            UserPackageId = request.UserPackageId,
            LocationId = request.LocationId,
            StartTime = request.StartTimeUtc,
            EndTime = request.StartTimeUtc.AddMinutes(setting.SessionDurationMinutes),
            Status = AppointmentStatus.Confirmed,
            LockExpirationTime = DateTime.UtcNow,
        };

        _db.Appointments.Add(appointment);
        userPackage.RemainingSessions -= 1;

        await _notificationService.AppointmentCreatedAsync(
            trainerId, request.ClientId, appointment.StartTime, userPackage.RemainingSessions, ct);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return new BookForClientResult(false, "That slot was just taken.", null);
        }

        await _notifier.NotifySlotStatusChangedAsync(
            new SlotStatusChangedMessage(trainerId, request.StartTimeUtc, SlotStatus.Booked), ct);

        return new BookForClientResult(true, null, appointment.Id);
    }

    public async Task<MarkAttendanceResult> MarkAttendanceAsync(Guid trainerId, Guid appointmentId, bool attended, CancellationToken ct = default)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.TrainerId == trainerId, ct);

        if (appointment is null)
            return new MarkAttendanceResult(false, "Appointment not found.");

        if (appointment.Status != AppointmentStatus.Confirmed)
            return new MarkAttendanceResult(false, "Only a confirmed appointment can have its attendance recorded.");

        if (appointment.EndTime > DateTime.UtcNow)
            return new MarkAttendanceResult(false, "Attendance can only be recorded after the session has ended.");

        appointment.Status = attended ? AppointmentStatus.Completed : AppointmentStatus.NoShow;
        await _db.SaveChangesAsync(ct);

        return new MarkAttendanceResult(true, null);
    }

    public async Task<IReadOnlyList<AppointmentSummaryDto>> GetTrainerAppointmentsAsync(
        Guid trainerId, DateOnly from, DateOnly to, AppointmentStatus? status, CancellationToken ct = default)
    {
        var fromUtc = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtc = to.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).AddDays(1);

        var query = _db.Appointments.AsNoTracking()
            .Include(a => a.Client)
            .Where(a => a.TrainerId == trainerId && a.StartTime >= fromUtc && a.StartTime < toUtc);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        return await query
            .OrderBy(a => a.StartTime)
            .Select(a => new AppointmentSummaryDto(
                a.Id, a.ClientId, a.Client.FullName, a.StartTime, a.EndTime, a.Status.ToString(), a.Location.Name))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<MyPackageDto>> GetMyPackagesForTrainerAsync(Guid clientId, Guid trainerId, CancellationToken ct = default)
    {
        return await _db.UserPackages.AsNoTracking()
            .Include(up => up.Package)
            .Where(up => up.ClientId == clientId
                && up.Package.TrainerId == trainerId
                && up.IsActive
                && up.RemainingSessions > 0)
            .OrderByDescending(up => up.PurchasedAt)
            .Select(up => new MyPackageDto(up.Id, up.PackageId, up.Package.Title, up.RemainingSessions, up.TotalSessions))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<MyPackageDetailDto>> GetMyPackagesFullForTrainerAsync(Guid clientId, Guid trainerId, CancellationToken ct = default)
    {
        return await _db.UserPackages.AsNoTracking()
            .Include(up => up.Package)
            .Where(up => up.ClientId == clientId && up.Package.TrainerId == trainerId)
            .OrderByDescending(up => up.PurchasedAt)
            .Select(up => new MyPackageDetailDto(
                up.Id, up.PackageId, up.Package.Title, up.RemainingSessions, up.TotalSessions,
                !up.IsActive ? "Pending" : (up.RemainingSessions > 0 ? "Active" : "Completed"),
                up.PurchasedAt))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ClientAppointmentSummaryDto>> GetClientAppointmentsAsync(Guid clientId, CancellationToken ct = default)
    {
        return await _db.Appointments.AsNoTracking()
            .Include(a => a.Trainer)
            .Where(a => a.ClientId == clientId && a.Status != AppointmentStatus.Locked)
            .OrderByDescending(a => a.StartTime)
            .Select(a => new ClientAppointmentSummaryDto(a.Id, a.TrainerId, a.Trainer.FullName, a.StartTime, a.EndTime, a.Status.ToString()))
            .ToListAsync(ct);
    }

    public async Task<TrainerDashboardStatsDto> GetTrainerDashboardStatsAsync(Guid trainerId, CancellationToken ct = default)
    {
        var todayIstanbul = IstanbulClock.TodayIstanbul();
        var todayStartUtc = IstanbulClock.ConvertLocalToUtc(todayIstanbul.ToDateTime(TimeOnly.MinValue));
        var todayEndUtc = IstanbulClock.ConvertLocalToUtc(todayIstanbul.ToDateTime(TimeOnly.MinValue).AddDays(1));

        var todayAppointmentsQuery = _db.Appointments.AsNoTracking()
            .Where(a => a.TrainerId == trainerId
                && a.StartTime >= todayStartUtc && a.StartTime < todayEndUtc
                && (a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.Completed));

        var todayAppointmentCount = await todayAppointmentsQuery.CountAsync(ct);

        var todayByLocation = (await todayAppointmentsQuery
                .Select(a => new { a.LocationId, LocationName = a.Location.Name })
                .ToListAsync(ct))
            .GroupBy(a => new { a.LocationId, a.LocationName })
            .Select(g => new TodayAppointmentLocationCountDto(g.Key.LocationId, g.Key.LocationName, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var totalClients = await _db.UserPackages.AsNoTracking()
            .Where(up => up.Package.TrainerId == trainerId)
            .Select(up => up.ClientId)
            .Distinct()
            .CountAsync(ct);

        var totalRevenue = await _db.Payments.AsNoTracking()
            .Where(p => p.Package.TrainerId == trainerId && p.IsSuccess)
            .SumAsync(p => p.Amount, ct);

        var isTodayClosed = await _db.TrainerClosedDays.AsNoTracking()
            .AnyAsync(d => d.TrainerId == trainerId && d.Date == todayIstanbul, ct);

        return new TrainerDashboardStatsDto(todayAppointmentCount, totalClients, totalRevenue, isTodayClosed, todayByLocation);
    }

    public async Task<IReadOnlyList<TrainerClientSummaryDto>> GetMyClientsAsync(Guid trainerId, CancellationToken ct = default)
    {
        var pooled = await _db.UserPackages.AsNoTracking()
            .Where(up => up.Package.TrainerId == trainerId)
            .GroupBy(up => up.ClientId)
            .Select(g => new { ClientId = g.Key, RemainingSessions = g.Sum(up => up.RemainingSessions) })
            .ToListAsync(ct);

        var clientIds = pooled.Select(p => p.ClientId).ToList();
        var users = await _db.Users.AsNoTracking()
            .Where(u => clientIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.DateOfBirth })
            .ToDictionaryAsync(u => u.Id, ct);

        var recentPackages = await _db.UserPackages.AsNoTracking()
            .Include(up => up.Package)
            .Where(up => up.Package.TrainerId == trainerId && clientIds.Contains(up.ClientId))
            .OrderByDescending(up => up.PurchasedAt)
            .Select(up => new { up.ClientId, up.Package.Title })
            .ToListAsync(ct);
        var latestPackageTitleByClient = recentPackages
            .GroupBy(p => p.ClientId)
            .ToDictionary(g => g.Key, g => g.First().Title);

        return pooled
            .Select(p => new TrainerClientSummaryDto(
                p.ClientId,
                users[p.ClientId].FullName,
                p.RemainingSessions,
                users[p.ClientId].DateOfBirth,
                latestPackageTitleByClient.GetValueOrDefault(p.ClientId)))
            .OrderBy(c => c.ClientName)
            .ToList();
    }

    public async Task<ClientHistoryResponse?> GetClientHistoryAsync(Guid trainerId, Guid clientId, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        var client = await _db.Users.AsNoTracking()
            .Where(u => u.Id == clientId)
            .Select(u => new { u.FullName, u.Email, u.Phone, u.City, u.DateOfBirth })
            .FirstAsync(ct);

        var packages = await _db.UserPackages.AsNoTracking()
            .Include(up => up.Package)
            .Where(up => up.ClientId == clientId && up.Package.TrainerId == trainerId)
            .OrderByDescending(up => up.PurchasedAt)
            .Select(up => new ClientPackageHistoryDto(up.Id, up.PackageId, up.Package.Title, up.TotalSessions, up.RemainingSessions, up.IsActive, up.PurchasedAt))
            .ToListAsync(ct);

        var payments = await _db.Payments.AsNoTracking()
            .Include(p => p.Package)
            .Where(p => p.ClientId == clientId && p.Package.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ClientPaymentHistoryDto(
                p.Id, p.Package.Title, p.Amount,
                p.IsSuccess ? "Paid" : (p.ErrorMessage != null ? "Failed" : "Pending"),
                p.Method != null ? p.Method.ToString() : null,
                p.CreatedAt))
            .ToListAsync(ct);

        return new ClientHistoryResponse(client.FullName, client.Email ?? string.Empty, client.Phone, client.City, client.DateOfBirth, packages, payments);
    }

    public async Task<IReadOnlyList<MyTrainerSummaryDto>> GetMyTrainersAsync(Guid clientId, CancellationToken ct = default)
    {
        var fromPackages = _db.UserPackages.AsNoTracking()
            .Where(up => up.ClientId == clientId)
            .Select(up => up.Package.TrainerId);

        var fromAppointments = _db.Appointments.AsNoTracking()
            .Where(a => a.ClientId == clientId && a.Status != AppointmentStatus.Locked)
            .Select(a => a.TrainerId);

        var trainerIds = await fromPackages.Union(fromAppointments).ToListAsync(ct);

        return await _db.Users.AsNoTracking()
            .Where(u => trainerIds.Contains(u.Id) && u.CalendarSlug != null)
            .OrderBy(u => u.FullName)
            .Select(u => new MyTrainerSummaryDto(u.Id, u.FullName, u.CalendarSlug!))
            .ToListAsync(ct);
    }

    private async Task<bool> ClientBelongsToTrainerAsync(Guid trainerId, Guid clientId, CancellationToken ct) =>
        await _db.ClientInvites.AsNoTracking().AnyAsync(i => i.ClientId == clientId && i.TrainerId == trainerId, ct)
        || await _db.UserPackages.AsNoTracking().AnyAsync(up => up.ClientId == clientId && up.Package.TrainerId == trainerId, ct);

    public async Task<IReadOnlyList<ClientGoalDto>?> GetClientGoalsAsync(Guid trainerId, Guid clientId, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        return await _db.ClientGoals.AsNoTracking()
            .Where(g => g.TrainerId == trainerId && g.ClientId == clientId)
            .OrderBy(g => g.CreatedAt)
            .Select(g => new ClientGoalDto(g.Id, g.Label, g.Caption, g.PercentComplete, g.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<ClientGoalDto?> CreateClientGoalAsync(Guid trainerId, Guid clientId, CreateClientGoalRequest request, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        var goal = new ClientGoal
        {
            TrainerId = trainerId,
            ClientId = clientId,
            Label = request.Label,
            Caption = request.Caption,
            PercentComplete = Math.Clamp(request.PercentComplete, 0, 100),
        };

        _db.ClientGoals.Add(goal);
        await _db.SaveChangesAsync(ct);

        return new ClientGoalDto(goal.Id, goal.Label, goal.Caption, goal.PercentComplete, goal.CreatedAt);
    }

    public async Task<IReadOnlyList<ClientGoalDto>> GetMyGoalsAsync(Guid clientId, Guid trainerId, CancellationToken ct = default)
    {
        return await _db.ClientGoals.AsNoTracking()
            .Where(g => g.ClientId == clientId && g.TrainerId == trainerId)
            .OrderBy(g => g.CreatedAt)
            .Select(g => new ClientGoalDto(g.Id, g.Label, g.Caption, g.PercentComplete, g.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ClientNoteDto>?> GetClientNotesAsync(Guid trainerId, Guid clientId, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        return await _db.ClientNotes.AsNoTracking()
            .Include(n => n.Trainer)
            .Where(n => n.TrainerId == trainerId && n.ClientId == clientId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new ClientNoteDto(n.Id, n.Trainer.FullName, n.Body, n.Tags, n.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<ClientNoteDto?> CreateClientNoteAsync(Guid trainerId, Guid clientId, CreateClientNoteRequest request, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        var note = new ClientNote
        {
            TrainerId = trainerId,
            ClientId = clientId,
            Body = request.Body,
            Tags = request.Tags.ToArray(),
        };

        _db.ClientNotes.Add(note);
        await _db.SaveChangesAsync(ct);

        var trainerName = await _db.Users.AsNoTracking().Where(u => u.Id == trainerId).Select(u => u.FullName).FirstAsync(ct);
        return new ClientNoteDto(note.Id, trainerName, note.Body, note.Tags, note.CreatedAt);
    }

    public async Task<IReadOnlyList<ClientNoteDto>> GetMyNotesAsync(Guid clientId, Guid trainerId, CancellationToken ct = default)
    {
        return await _db.ClientNotes.AsNoTracking()
            .Include(n => n.Trainer)
            .Where(n => n.ClientId == clientId && n.TrainerId == trainerId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new ClientNoteDto(n.Id, n.Trainer.FullName, n.Body, n.Tags, n.CreatedAt))
            .ToListAsync(ct);
    }

    private static BodyMetricDto ToDto(BodyMetric m) =>
        new(m.Id, m.RecordedAt, m.WeightKg, m.ChestCm, m.WaistCm, m.HipCm, m.ArmCm, m.BodyFatPercent);

    public async Task<IReadOnlyList<BodyMetricDto>?> GetClientBodyMetricsAsync(Guid trainerId, Guid clientId, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        var metrics = await _db.BodyMetrics.AsNoTracking()
            .Where(m => m.TrainerId == trainerId && m.ClientId == clientId)
            .OrderBy(m => m.RecordedAt)
            .ToListAsync(ct);

        return metrics.Select(ToDto).ToList();
    }

    public async Task<BodyMetricDto?> CreateBodyMetricAsync(Guid trainerId, Guid clientId, CreateBodyMetricRequest request, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        var metric = new BodyMetric
        {
            TrainerId = trainerId,
            ClientId = clientId,
            WeightKg = request.WeightKg,
            ChestCm = request.ChestCm,
            WaistCm = request.WaistCm,
            HipCm = request.HipCm,
            ArmCm = request.ArmCm,
            BodyFatPercent = request.BodyFatPercent,
        };

        _db.BodyMetrics.Add(metric);
        await _db.SaveChangesAsync(ct);

        return ToDto(metric);
    }

    public async Task<IReadOnlyList<BodyMetricDto>> GetMyBodyMetricsAsync(Guid clientId, Guid trainerId, CancellationToken ct = default)
    {
        var metrics = await _db.BodyMetrics.AsNoTracking()
            .Where(m => m.ClientId == clientId && m.TrainerId == trainerId)
            .OrderBy(m => m.RecordedAt)
            .ToListAsync(ct);

        return metrics.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<UpcomingBirthdayDto>> GetUpcomingBirthdaysAsync(Guid trainerId, int withinDays = 30, CancellationToken ct = default)
    {
        var clientIds = await _db.UserPackages.AsNoTracking()
            .Where(up => up.Package.TrainerId == trainerId)
            .Select(up => up.ClientId)
            .Distinct()
            .ToListAsync(ct);

        var clients = await _db.Users.AsNoTracking()
            .Where(u => clientIds.Contains(u.Id) && u.DateOfBirth != null)
            .Select(u => new { u.Id, u.FullName, DateOfBirth = u.DateOfBirth!.Value })
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(IstanbulClock.ConvertUtcToLocal(DateTime.UtcNow));

        return clients
            .Select(c =>
            {
                var nextBirthday = new DateOnly(today.Year, c.DateOfBirth.Month, c.DateOfBirth.Day);
                if (nextBirthday < today)
                    nextBirthday = nextBirthday.AddYears(1);
                var daysUntil = nextBirthday.DayNumber - today.DayNumber;
                return new UpcomingBirthdayDto(c.Id, c.FullName, c.DateOfBirth, daysUntil);
            })
            .Where(b => b.DaysUntil <= withinDays)
            .OrderBy(b => b.DaysUntil)
            .ToList();
    }

    public async Task<ReviewDto?> GetMyReviewAsync(Guid clientId, Guid trainerId, CancellationToken ct = default)
    {
        return await _db.Reviews.AsNoTracking()
            .Include(r => r.Client)
            .Where(r => r.ClientId == clientId && r.TrainerId == trainerId)
            .Select(r => new ReviewDto(r.Id, r.Client.FullName, r.Rating, r.Comment, r.CreatedAt))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<ReviewDto?> UpsertMyReviewAsync(Guid clientId, Guid trainerId, UpsertReviewRequest request, CancellationToken ct = default)
    {
        if (!await ClientBelongsToTrainerAsync(trainerId, clientId, ct))
            return null;

        var rating = Math.Clamp(request.Rating, 1, 5);
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.ClientId == clientId && r.TrainerId == trainerId, ct);
        if (review is null)
        {
            review = new Review { TrainerId = trainerId, ClientId = clientId, Rating = rating, Comment = request.Comment };
            _db.Reviews.Add(review);
        }
        else
        {
            review.Rating = rating;
            review.Comment = request.Comment;
            review.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        var clientName = await _db.Users.AsNoTracking().Where(u => u.Id == clientId).Select(u => u.FullName).FirstAsync(ct);
        return new ReviewDto(review.Id, clientName, review.Rating, review.Comment, review.CreatedAt);
    }

    public async Task<bool> GetFavoriteStatusAsync(Guid clientId, Guid trainerId, CancellationToken ct = default) =>
        await _db.FavoriteTrainers.AsNoTracking().AnyAsync(f => f.ClientId == clientId && f.TrainerId == trainerId, ct);

    public async Task SetFavoriteAsync(Guid clientId, Guid trainerId, bool favorite, CancellationToken ct = default)
    {
        var existing = await _db.FavoriteTrainers.FirstOrDefaultAsync(f => f.ClientId == clientId && f.TrainerId == trainerId, ct);

        if (favorite && existing is null)
            _db.FavoriteTrainers.Add(new FavoriteTrainer { ClientId = clientId, TrainerId = trainerId });
        else if (!favorite && existing is not null)
            _db.FavoriteTrainers.Remove(existing);
        else
            return;

        await _db.SaveChangesAsync(ct);
    }

    public async Task<CancelRemainingResult> CancelRemainingAppointmentsAsync(Guid trainerId, DateOnly date, CancellationToken ct = default)
    {
        var istanbulMidnightLocal = date.ToDateTime(TimeOnly.MinValue);
        var dayStartUtc = IstanbulClock.ConvertLocalToUtc(istanbulMidnightLocal);
        var dayEndUtc = IstanbulClock.ConvertLocalToUtc(istanbulMidnightLocal.AddDays(1));

        var cutoffUtc = dayStartUtc > DateTime.UtcNow ? dayStartUtc : DateTime.UtcNow;

        var appointments = await _db.Appointments
            .Include(a => a.UserPackage)
            .Where(a => a.TrainerId == trainerId
                && a.Status == AppointmentStatus.Confirmed
                && a.StartTime >= cutoffUtc && a.StartTime < dayEndUtc)
            .ToListAsync(ct);

        if (appointments.Count == 0)
            return new CancelRemainingResult(true, null, 0);

        foreach (var appointment in appointments)
        {
            appointment.Status = AppointmentStatus.Cancelled;
            appointment.UserPackage.RemainingSessions += 1;

            await _notifier.NotifySlotStatusChangedAsync(
                new SlotStatusChangedMessage(trainerId, appointment.StartTime, SlotStatus.Available), ct);

            await _notificationService.DayCancelledAsync(trainerId, appointment.ClientId, appointment.StartTime, ct);
        }

        var closedDay = await _db.TrainerClosedDays.FirstOrDefaultAsync(d => d.TrainerId == trainerId && d.Date == date, ct);
        if (closedDay is null)
            _db.TrainerClosedDays.Add(new TrainerClosedDay { TrainerId = trainerId, Date = date, Reason = TrainerClosedDayReason.BulkCancelled });
        else
            closedDay.Reason = TrainerClosedDayReason.BulkCancelled;

        await _db.SaveChangesAsync(ct);

        return new CancelRemainingResult(true, null, appointments.Count);
    }
}
