using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Account;
using PersonalTrainer.Application.Common;
using PersonalTrainer.Application.Email;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Account;

public class AccountService : IAccountService
{
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(15);

    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly IEmailOutbox _outbox;

    public AccountService(AppDbContext db, UserManager<User> userManager, IEmailOutbox outbox)
    {
        _db = db;
        _userManager = userManager;
        _outbox = outbox;
    }

    public async Task<AccountProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        return user is null ? null : ToDto(user);
    }

    public async Task<AccountProfileDto?> UpdateProfileAsync(Guid userId, UpdateAccountProfileRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return null;

        user.Phone = PhoneNumber.Normalize(request.Phone);
        user.City = request.City;
        user.DateOfBirth = request.DateOfBirth;
        user.HeightCm = request.HeightCm;
        await _db.SaveChangesAsync(ct);

        return ToDto(user);
    }

    public async Task<AccountActionResult> SetInitialWeightAsync(Guid userId, decimal weightKg, CancellationToken ct = default)
    {
        var trainerId = await _db.ClientInvites.AsNoTracking()
            .Where(i => i.ClientId == userId)
            .Select(i => (Guid?)i.TrainerId)
            .FirstOrDefaultAsync(ct);

        if (trainerId is null)
            return new AccountActionResult(false, "No trainer relationship found for this account.");

        _db.BodyMetrics.Add(new BodyMetric
        {
            TrainerId = trainerId.Value,
            ClientId = userId,
            WeightKg = weightKg,
        });

        await _db.SaveChangesAsync(ct);
        return new AccountActionResult(true, null);
    }

    public async Task<AccountActionResult> RequestEmailActivationAsync(Guid userId, string email, CancellationToken ct = default)
    {
        var existing = await _userManager.FindByEmailAsync(email);
        if (existing is not null && existing.Id != userId)
            return new AccountActionResult(false, "This email is already in use.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return new AccountActionResult(false, "Account not found.");

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        user.Email = email;
        user.NormalizedEmail = email.ToUpperInvariant();
        user.PendingEmailCode = Hash(code);
        user.PendingEmailCodeExpiresAt = DateTime.UtcNow.Add(CodeLifetime);

        _outbox.Enqueue(email, EmailTemplateKey.EmailVerificationCode, new Dictionary<string, string>
        {
            ["Code"] = code,
            ["ExpiryMinutes"] = ((int)CodeLifetime.TotalMinutes).ToString(),
        });

        await _db.SaveChangesAsync(ct);

        return new AccountActionResult(true, null);
    }

    public async Task<AccountActionResult> ConfirmEmailActivationAsync(Guid userId, string code, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return new AccountActionResult(false, "Account not found.");

        if (user.PendingEmailCode is null || user.PendingEmailCodeExpiresAt is null || user.PendingEmailCodeExpiresAt < DateTime.UtcNow)
            return new AccountActionResult(false, "No active verification code. Please request a new one.");

        if (user.PendingEmailCode != Hash(code))
            return new AccountActionResult(false, "Invalid code.");

        user.EmailConfirmed = true;
        user.UserName = user.Email;
        user.NormalizedUserName = user.NormalizedEmail;
        user.PendingEmailCode = null;
        user.PendingEmailCodeExpiresAt = null;
        await _db.SaveChangesAsync(ct);

        return new AccountActionResult(true, null);
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static AccountProfileDto ToDto(User user) =>
        new(user.FullName, user.Email ?? string.Empty, user.Phone, user.City, user.DateOfBirth, user.HeightCm, user.EmailConfirmed);
}
