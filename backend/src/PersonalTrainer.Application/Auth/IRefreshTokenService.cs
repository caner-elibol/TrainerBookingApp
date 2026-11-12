namespace PersonalTrainer.Application.Auth;

public record RefreshTokenResult(string RawToken, DateTime ExpiresAtUtc);

public record RefreshRotationResult(Guid UserId, string NewRawToken, DateTime NewExpiresAtUtc);

public interface IRefreshTokenService
{
    Task<RefreshTokenResult> IssueAsync(Guid userId, CancellationToken ct = default);

    Task<RefreshRotationResult?> ValidateAndRotateAsync(string rawToken, CancellationToken ct = default);

    Task RevokeAsync(string rawToken, CancellationToken ct = default);
}
