using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Notifications;

public interface INotificationService
{
    Task AppointmentCreatedAsync(
        Guid trainerId, Guid clientId, DateTime startTimeUtc, int remainingSessions, CancellationToken ct = default);

    Task AppointmentCancelledAsync(
        Guid trainerId, Guid clientId, DateTime startTimeUtc, bool cancelledByTrainer, bool sessionRefunded,
        CancellationToken ct = default);

    Task DayCancelledAsync(Guid trainerId, Guid clientId, DateTime startTimeUtc, CancellationToken ct = default);

    Task PackageAssignedAsync(
        Guid trainerId, Guid clientId, string packageName, int sessionCount, CancellationToken ct = default);

    Task PackagePurchasedAsync(
        Guid trainerId, Guid clientId, string packageName, int sessionCount, decimal amount,
        CancellationToken ct = default);

    Task PaymentReceivedAsync(
        Guid trainerId, Guid clientId, string packageName, decimal amount, PaymentMethod? method,
        CancellationToken ct = default);
}
