using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Email;
using PersonalTrainer.Application.Notifications;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Common;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IEmailOutbox _outbox;

    public NotificationService(AppDbContext db, IEmailOutbox outbox)
    {
        _db = db;
        _outbox = outbox;
    }

    public async Task AppointmentCreatedAsync(
        Guid trainerId, Guid clientId, DateTime startTimeUtc, int remainingSessions, CancellationToken ct = default)
    {
        var (trainer, client) = await LoadUsersAsync(trainerId, clientId, ct);
        var setting = await LoadSettingAsync(trainerId, ct);
        var (date, time) = FormatIstanbul(startTimeUtc);

        if (IsClientReachable(client))
        {
            _outbox.Enqueue(client.Email!, EmailTemplateKey.AppointmentCreatedForClient, new Dictionary<string, string>
            {
                ["ClientName"] = client.FullName,
                ["TrainerName"] = trainer.FullName,
                ["Date"] = date,
                ["Time"] = time,
                ["RemainingSessions"] = remainingSessions.ToString(),
            });
        }

        if (IsTrainerReachable(trainer) && (setting?.NotifyEmailEnabled ?? true))
        {
            _outbox.Enqueue(trainer.Email!, EmailTemplateKey.AppointmentCreatedForTrainer, new Dictionary<string, string>
            {
                ["TrainerName"] = trainer.FullName,
                ["ClientName"] = client.FullName,
                ["Date"] = date,
                ["Time"] = time,
            });
        }
    }

    public async Task AppointmentCancelledAsync(
        Guid trainerId, Guid clientId, DateTime startTimeUtc, bool cancelledByTrainer, bool sessionRefunded,
        CancellationToken ct = default)
    {
        var (trainer, client) = await LoadUsersAsync(trainerId, clientId, ct);
        var setting = await LoadSettingAsync(trainerId, ct);
        var (date, time) = FormatIstanbul(startTimeUtc);
        var cancelledBy = cancelledByTrainer ? trainer.FullName : client.FullName;
        var refundNote = sessionRefunded
            ? "Seans hakkınız paketinize iade edildi."
            : "Geç iptal nedeniyle bu randevu için seans hakkınız iade edilmedi.";

        if (IsClientReachable(client))
        {
            _outbox.Enqueue(client.Email!, EmailTemplateKey.AppointmentCancelledForClient, new Dictionary<string, string>
            {
                ["ClientName"] = client.FullName,
                ["TrainerName"] = trainer.FullName,
                ["Date"] = date,
                ["Time"] = time,
                ["CancelledBy"] = cancelledBy,
                ["RefundNote"] = refundNote,
            });
        }

        if (IsTrainerReachable(trainer) && (setting?.NotifyEmailEnabled ?? true))
        {
            _outbox.Enqueue(trainer.Email!, EmailTemplateKey.AppointmentCancelledForTrainer, new Dictionary<string, string>
            {
                ["TrainerName"] = trainer.FullName,
                ["ClientName"] = client.FullName,
                ["Date"] = date,
                ["Time"] = time,
                ["CancelledBy"] = cancelledBy,
            });
        }
    }

    public async Task DayCancelledAsync(Guid trainerId, Guid clientId, DateTime startTimeUtc, CancellationToken ct = default)
    {
        var (trainer, client) = await LoadUsersAsync(trainerId, clientId, ct);
        var (date, time) = FormatIstanbul(startTimeUtc);

        if (IsClientReachable(client))
        {
            _outbox.Enqueue(client.Email!, EmailTemplateKey.DayCancelledForClient, new Dictionary<string, string>
            {
                ["ClientName"] = client.FullName,
                ["TrainerName"] = trainer.FullName,
                ["Date"] = date,
                ["Time"] = time,
            });
        }
    }

    public async Task PackageAssignedAsync(
        Guid trainerId, Guid clientId, string packageName, int sessionCount, CancellationToken ct = default)
    {
        var (trainer, client) = await LoadUsersAsync(trainerId, clientId, ct);

        if (IsClientReachable(client))
        {
            _outbox.Enqueue(client.Email!, EmailTemplateKey.PackageAssignedForClient, new Dictionary<string, string>
            {
                ["ClientName"] = client.FullName,
                ["TrainerName"] = trainer.FullName,
                ["PackageName"] = packageName,
                ["SessionCount"] = sessionCount.ToString(),
            });
        }
    }

    public async Task PackagePurchasedAsync(
        Guid trainerId, Guid clientId, string packageName, int sessionCount, decimal amount,
        CancellationToken ct = default)
    {
        var (trainer, client) = await LoadUsersAsync(trainerId, clientId, ct);
        var setting = await LoadSettingAsync(trainerId, ct);
        var amountText = FormatAmount(amount);

        if (IsClientReachable(client))
        {
            _outbox.Enqueue(client.Email!, EmailTemplateKey.PackagePurchasedForClient, new Dictionary<string, string>
            {
                ["ClientName"] = client.FullName,
                ["PackageName"] = packageName,
                ["SessionCount"] = sessionCount.ToString(),
                ["Amount"] = amountText,
            });
        }

        if (IsTrainerReachable(trainer) && (setting?.NotifyPaymentEnabled ?? true))
        {
            _outbox.Enqueue(trainer.Email!, EmailTemplateKey.PackagePurchasedForTrainer, new Dictionary<string, string>
            {
                ["TrainerName"] = trainer.FullName,
                ["ClientName"] = client.FullName,
                ["PackageName"] = packageName,
                ["Amount"] = amountText,
            });
        }
    }

    public async Task PaymentReceivedAsync(
        Guid trainerId, Guid clientId, string packageName, decimal amount, PaymentMethod? method,
        CancellationToken ct = default)
    {
        var (_, client) = await LoadUsersAsync(trainerId, clientId, ct);

        if (IsClientReachable(client))
        {
            _outbox.Enqueue(client.Email!, EmailTemplateKey.PaymentReceivedForClient, new Dictionary<string, string>
            {
                ["ClientName"] = client.FullName,
                ["PackageName"] = packageName,
                ["Amount"] = FormatAmount(amount),
                ["Method"] = FormatMethod(method),
            });
        }
    }

    private async Task<(UserInfo Trainer, UserInfo Client)> LoadUsersAsync(Guid trainerId, Guid clientId, CancellationToken ct)
    {
        var users = await _db.Users.AsNoTracking()
            .Where(u => u.Id == trainerId || u.Id == clientId)
            .Select(u => new UserInfo(u.Id, u.FullName, u.Email, u.EmailConfirmed))
            .ToListAsync(ct);

        var trainer = users.First(u => u.Id == trainerId);
        var client = users.First(u => u.Id == clientId);
        return (trainer, client);
    }

    private Task<Domain.Entities.TrainerSetting?> LoadSettingAsync(Guid trainerId, CancellationToken ct) =>
        _db.TrainerSettings.AsNoTracking().FirstOrDefaultAsync(s => s.TrainerId == trainerId, ct);

    private static (string Date, string Time) FormatIstanbul(DateTime startTimeUtc)
    {
        var local = IstanbulClock.ConvertUtcToLocal(startTimeUtc);
        return (local.ToString("dd.MM.yyyy"), local.ToString("HH:mm"));
    }

    private static string FormatAmount(decimal amount) => $"{amount:N2} TL";

    private static string FormatMethod(PaymentMethod? method) => method switch
    {
        PaymentMethod.Cash => "Nakit",
        PaymentMethod.BankTransfer => "Havale/EFT",
        _ => "Online",
    };

    private static bool IsClientReachable(UserInfo client) =>
        client.EmailConfirmed && !string.IsNullOrWhiteSpace(client.Email);

    private static bool IsTrainerReachable(UserInfo trainer) => !string.IsNullOrWhiteSpace(trainer.Email);

    private record UserInfo(Guid Id, string FullName, string? Email, bool EmailConfirmed);
}
