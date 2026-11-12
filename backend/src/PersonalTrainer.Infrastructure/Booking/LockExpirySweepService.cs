using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PersonalTrainer.Application.Locking;
using PersonalTrainer.Application.Realtime;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Booking;

public class LockExpirySweepService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LockExpirySweepService> _logger;

    public LockExpirySweepService(IServiceScopeFactory scopeFactory, ILogger<LockExpirySweepService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await SweepExpiredLocksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lock expiry sweep failed");
            }
        }
    }

    private async Task SweepExpiredLocksAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var lockService = scope.ServiceProvider.GetRequiredService<IReservationLockService>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAvailabilityNotifier>();

        var now = DateTime.UtcNow;
        var expired = await db.Appointments
            .Where(a => a.Status == AppointmentStatus.Locked && a.LockExpirationTime < now)
            .Select(a => new { a.Id, a.TrainerId, a.StartTime })
            .ToListAsync(ct);

        if (expired.Count == 0)
            return;

        var expiredIds = expired.Select(a => a.Id).ToList();
        await db.Appointments
            .Where(a => expiredIds.Contains(a.Id))
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Status, AppointmentStatus.Cancelled), ct);

        foreach (var appointment in expired)
        {
            await lockService.ReleaseLockAsync(appointment.TrainerId, appointment.StartTime, ct);
            await notifier.NotifySlotStatusChangedAsync(
                new SlotStatusChangedMessage(appointment.TrainerId, appointment.StartTime, SlotStatus.Available), ct);
        }

        _logger.LogInformation("Released {Count} expired reservation locks", expired.Count);
    }
}
