using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Booking;

public class AppointmentCompletionSweepService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentCompletionSweepService> _logger;

    public AppointmentCompletionSweepService(IServiceScopeFactory scopeFactory, ILogger<AppointmentCompletionSweepService> logger)
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
                await MarkCompletedAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Appointment completion sweep failed");
            }
        }
    }

    private async Task MarkCompletedAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var count = await db.Appointments
            .Where(a => a.Status == AppointmentStatus.Confirmed && a.EndTime < now.AddHours(-48))
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Status, AppointmentStatus.Completed), ct);

        if (count > 0)
            _logger.LogInformation("Marked {Count} past-due appointments as Completed", count);
    }
}
