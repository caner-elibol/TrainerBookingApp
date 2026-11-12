namespace PersonalTrainer.Application.Locking;

public interface IReservationLockService
{
    Task<bool> TryAcquireLockAsync(Guid trainerId, DateTime startTimeUtc, TimeSpan ttl, CancellationToken ct = default);

    Task ReleaseLockAsync(Guid trainerId, DateTime startTimeUtc, CancellationToken ct = default);
}
