using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Auth;
using PersonalTrainer.Application.Common;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Auth;

public class OtpAuthService : IOtpAuthService
{
    private const string DevFixedCode = "123456";

    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public OtpAuthService(
        AppDbContext db, UserManager<User> userManager, ITokenService tokenService, IRefreshTokenService refreshTokenService)
    {
        _db = db;
        _userManager = userManager;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<OtpVerifyResult> VerifyAsync(string phone, string code, string? fullName, UserRole? role, CancellationToken ct = default)
    {
        var normalizedPhone = PhoneNumber.Normalize(phone);
        if (normalizedPhone is null)
            return new OtpVerifyResult(false, PhoneNumber.InvalidMessage, false, null);
        phone = normalizedPhone;

        if (code != DevFixedCode)
            return new OtpVerifyResult(false, "Kod hatalı.", false, null);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Phone == phone, ct);

        if (user is null)
        {
            if (string.IsNullOrWhiteSpace(fullName) || role is null)
                return new OtpVerifyResult(true, null, true, null);

            user = new User
            {
                UserName = Guid.NewGuid().ToString("N"),
                Email = $"{Guid.NewGuid():N}@phone.invalid",
                FullName = fullName,
                Phone = phone,
                Role = role.Value,
                PhoneNumberConfirmed = true,
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return new OtpVerifyResult(false, string.Join(" ", createResult.Errors.Select(e => e.Description)), false, null);
        }

        var access = _tokenService.GenerateAccessToken(user);
        var refresh = await _refreshTokenService.IssueAsync(user.Id, ct);
        var auth = new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken, refresh.ExpiresAtUtc);
        return new OtpVerifyResult(true, null, false, auth);
    }
}
