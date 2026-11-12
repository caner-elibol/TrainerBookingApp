using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Reports;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Common;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Reports;

public class ReportsService : IReportsService
{
    private readonly AppDbContext _db;

    public ReportsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TrainerReportsResponse> GetTrainerReportsAsync(Guid trainerId, CancellationToken ct = default)
    {
        var today = IstanbulClock.TodayIstanbul();
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthStartUtc = IstanbulClock.ConvertLocalToUtc(monthStart.ToDateTime(TimeOnly.MinValue));
        var sixMonthsAgoUtc = IstanbulClock.ConvertLocalToUtc(monthStart.AddMonths(-5).ToDateTime(TimeOnly.MinValue));

        var monthlyPayments = await _db.Payments.AsNoTracking()
            .Where(p => p.Package.TrainerId == trainerId && p.IsSuccess && p.CreatedAt >= monthStartUtc)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var activeClients = await _db.UserPackages.AsNoTracking()
            .Where(up => up.Package.TrainerId == trainerId && up.IsActive && up.RemainingSessions > 0)
            .Select(up => up.ClientId)
            .Distinct()
            .CountAsync(ct);

        var monthAppointments = await _db.Appointments.AsNoTracking()
            .Where(a => a.TrainerId == trainerId && a.StartTime >= monthStartUtc)
            .Select(a => a.Status)
            .ToListAsync(ct);

        var completedThisMonth = monthAppointments.Count(s => s == AppointmentStatus.Completed);
        var cancelledThisMonth = monthAppointments.Count(s => s == AppointmentStatus.Cancelled);
        var relevantThisMonth = monthAppointments.Count(s => s != AppointmentStatus.Locked);
        var cancellationRate = relevantThisMonth > 0 ? cancelledThisMonth * 100.0 / relevantThisMonth : 0;

        var summary = new ReportsSummaryDto(monthlyPayments, activeClients, completedThisMonth, cancellationRate);

        var revenueRows = await _db.Payments.AsNoTracking()
            .Where(p => p.Package.TrainerId == trainerId && p.IsSuccess && p.CreatedAt >= sixMonthsAgoUtc)
            .Select(p => new { p.CreatedAt, p.Amount })
            .ToListAsync(ct);

        var revenueTrend = BuildLastSixMonths(monthStart, month =>
            revenueRows
                .Where(r => IstanbulClock.ConvertUtcToLocal(r.CreatedAt) is var local && local.Year == month.Year && local.Month == month.Month)
                .Sum(r => r.Amount));

        var purchaseRows = await _db.UserPackages.AsNoTracking()
            .Where(up => up.Package.TrainerId == trainerId)
            .Select(up => new { up.ClientId, up.PurchasedAt })
            .ToListAsync(ct);

        var clientGrowth = BuildLastSixMonths(monthStart, month =>
        {
            var cutoffUtc = IstanbulClock.ConvertLocalToUtc(month.AddMonths(1).ToDateTime(TimeOnly.MinValue));
            return (decimal)purchaseRows.Where(r => r.PurchasedAt < cutoffUtc).Select(r => r.ClientId).Distinct().Count();
        });

        var fourWeeksAgoUtc = IstanbulClock.ConvertLocalToUtc(today.AddDays(-28).ToDateTime(TimeOnly.MinValue));
        var recentAppointments = await _db.Appointments.AsNoTracking()
            .Where(a => a.TrainerId == trainerId && a.StartTime >= fourWeeksAgoUtc && a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Locked)
            .Select(a => a.StartTime)
            .ToListAsync(ct);

        var weeklySessions = recentAppointments
            .Select(IstanbulClock.ConvertUtcToLocal)
            .GroupBy(d => (int)d.DayOfWeek)
            .Select(g => new WeeklySessionCountDto(g.Key, g.Count()))
            .OrderBy(x => x.DayOfWeek)
            .ToList();

        var busiestHours = recentAppointments
            .Select(IstanbulClock.ConvertUtcToLocal)
            .GroupBy(d => new { Day = (int)d.DayOfWeek, d.Hour })
            .Select(g => new HeatmapCellDto(g.Key.Day, g.Key.Hour, g.Count()))
            .ToList();

        var serviceMixTitles = await _db.Appointments.AsNoTracking()
            .Where(a => a.TrainerId == trainerId && a.StartTime >= fourWeeksAgoUtc && a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Locked)
            .Select(a => a.UserPackage.Package.Title)
            .ToListAsync(ct);

        var serviceMix = serviceMixTitles
            .GroupBy(title => title)
            .Select(g => new ServiceMixDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var successfulPaymentRows = await _db.Payments.AsNoTracking()
            .Where(p => p.Package.TrainerId == trainerId && p.IsSuccess)
            .Select(p => new { p.Package.Title, p.Amount })
            .ToListAsync(ct);

        var topPackages = successfulPaymentRows
            .GroupBy(p => p.Title)
            .Select(g => new TopPackageDto(g.Key, g.Sum(p => p.Amount), g.Count()))
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        return new TrainerReportsResponse(summary, revenueTrend, clientGrowth, weeklySessions, serviceMix, topPackages, busiestHours);
    }

    private static List<MonthlyPointDto> BuildLastSixMonths(DateOnly currentMonthStart, Func<DateOnly, decimal> valueForMonth)
    {
        var points = new List<MonthlyPointDto>();
        for (var i = 5; i >= 0; i--)
        {
            var month = currentMonthStart.AddMonths(-i);
            points.Add(new MonthlyPointDto(month.Year, month.Month, valueForMonth(month)));
        }
        return points;
    }
}
