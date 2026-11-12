using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PersonalTrainer.Application.Auth;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Auth;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly AppDbContext _db;
    private readonly JwtOptions _options;
    private readonly ILogger<RefreshTokenService> _logger;

    public RefreshTokenService(AppDbContext db, IOptions<JwtOptions> options, ILogger<RefreshTokenService> logger)
    {
        _db = db;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<RefreshTokenResult> IssueAsync(Guid userId, CancellationToken ct = default)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;

        var rawToken = GenerateRawToken();
        var expiresAtUtc = DateTime.UtcNow.AddDays(_options.RefreshTokenDays);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = Hash(rawToken),
            ExpiresAt = expiresAtUtc,
        });
        await _db.SaveChangesAsync(ct);

        return new RefreshTokenResult(rawToken, expiresAtUtc);
    }

    public async Task<RefreshRotationResult?> ValidateAndRotateAsync(string rawToken, CancellationToken ct = default)
    {
        var hash = Hash(rawToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (existing is null || existing.ExpiresAt < DateTime.UtcNow)
            return null;

        if (existing.RevokedAt is not null)
        {
            _logger.LogWarning("Reuse of a revoked refresh token detected for user {UserId}", existing.UserId);
            return null;
        }

        var newRawToken = GenerateRawToken();
        var newExpiresAtUtc = DateTime.UtcNow.AddDays(_options.RefreshTokenDays);

        var replacement = new RefreshToken
        {
            UserId = existing.UserId,
            TokenHash = Hash(newRawToken),
            ExpiresAt = newExpiresAtUtc,
        };
        _db.RefreshTokens.Add(replacement);

        existing.RevokedAt = DateTime.UtcNow;
        existing.ReplacedByTokenId = replacement.Id;

        await _db.SaveChangesAsync(ct);

        return new RefreshRotationResult(existing.UserId, newRawToken, newExpiresAtUtc);
    }

    public async Task RevokeAsync(string rawToken, CancellationToken ct = default)
    {
        var hash = Hash(rawToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (existing is null || existing.RevokedAt is not null)
            return;

        existing.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

    private static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken)));
}
