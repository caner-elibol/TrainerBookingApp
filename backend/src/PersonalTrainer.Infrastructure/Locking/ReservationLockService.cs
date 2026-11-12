using PersonalTrainer.Application.Locking;
using StackExchange.Redis;

namespace PersonalTrainer.Infrastructure.Locking;

public class ReservationLockService : IReservationLockService
{
    private readonly IConnectionMultiplexer _redis;

    public ReservationLockService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public Task<bool> TryAcquireLockAsync(Guid trainerId, DateTime startTimeUtc, TimeSpan ttl, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        return db.StringSetAsync(BuildKey(trainerId, startTimeUtc), Environment.MachineName, ttl, When.NotExists);
    }

    public Task ReleaseLockAsync(Guid trainerId, DateTime startTimeUtc, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        return db.KeyDeleteAsync(BuildKey(trainerId, startTimeUtc));
    }

    private static string BuildKey(Guid trainerId, DateTime startTimeUtc) =>
        $"lock:{trainerId}:{startTimeUtc:O}";
}
