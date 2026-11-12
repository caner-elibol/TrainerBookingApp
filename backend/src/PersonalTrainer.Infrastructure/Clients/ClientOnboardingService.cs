using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Auth;
using PersonalTrainer.Application.Clients;
using PersonalTrainer.Application.Common;
using PersonalTrainer.Application.Notifications;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Clients;

public class ClientOnboardingService : IClientOnboardingService
{
    private static readonly TimeSpan InviteLifetime = TimeSpan.FromDays(30);

    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly INotificationService _notificationService;

    public ClientOnboardingService(
        AppDbContext db, UserManager<User> userManager, ITokenService tokenService,
        IRefreshTokenService refreshTokenService, INotificationService notificationService)
    {
        _db = db;
        _userManager = userManager;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
        _notificationService = notificationService;
    }

    public async Task<CreateClientResult> CreateClientAsync(Guid trainerId, CreateClientRequest request, CancellationToken ct = default)
    {
        string? phone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            phone = PhoneNumber.Normalize(request.Phone);
            if (phone is null)
                return new CreateClientResult(false, PhoneNumber.InvalidMessage, null, null);
        }

        Package? package = null;
        if (request.PackageId.HasValue)
        {
            package = await _db.Packages.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.PackageId.Value && p.TrainerId == trainerId, ct);
            if (package is null)
                return new CreateClientResult(false, "Package not found.", null, null);

            if (!request.SessionCount.HasValue || request.SessionCount.Value <= 0)
                return new CreateClientResult(false, "Session count is required when a package is selected.", null, null);

            if (request.IsPaid && request.Method is null)
                return new CreateClientResult(false, "Ödeme yöntemi seçilmelidir.", null, null);
        }

        var user = phone is null
            ? null
            : await _db.Users.FirstOrDefaultAsync(u => u.Phone == phone, ct);

        if (user is null)
        {
            user = new User
            {
                UserName = Guid.NewGuid().ToString("N"),
                Email = $"{Guid.NewGuid():N}@invite.invalid",
                FullName = request.FullName,
                Phone = phone,
                Role = UserRole.Client,
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return new CreateClientResult(false, string.Join(" ", createResult.Errors.Select(e => e.Description)), null, null);
        }

        if (request.PackageId.HasValue)
        {
            CreateUserPackageAndPayment(user.Id, request.PackageId.Value, package!, request.SessionCount!.Value, request.IsPaid, request.Method);
        }

        var rawToken = GenerateRawToken();
        _db.ClientInvites.Add(new ClientInvite
        {
            ClientId = user.Id,
            TrainerId = trainerId,
            TokenHash = Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.Add(InviteLifetime),
        });

        await _db.SaveChangesAsync(ct);

        return new CreateClientResult(true, null, user.Id, rawToken);
    }

    public async Task<ResumeInviteResult> ResumeInviteAsync(string rawToken, CancellationToken ct = default)
    {
        var hash = Hash(rawToken);
        var invite = await _db.ClientInvites
            .Include(i => i.Client)
            .FirstOrDefaultAsync(i => i.TokenHash == hash, ct);

        if (invite is null || invite.ExpiresAt < DateTime.UtcNow)
            return new ResumeInviteResult(false, "Invite link is invalid or has expired.", false, null);

        var user = invite.Client;
        var isNewAccount = !user.PhoneNumberConfirmed;
        if (isNewAccount)
        {
            user.PhoneNumberConfirmed = true;
            await _db.SaveChangesAsync(ct);
        }

        var access = _tokenService.GenerateAccessToken(user);
        var refresh = await _refreshTokenService.IssueAsync(user.Id, ct);
        var auth = new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken, refresh.ExpiresAtUtc);

        return new ResumeInviteResult(true, null, isNewAccount, auth);
    }

    public async Task<AssignPackageResult> AssignPackageAsync(Guid trainerId, Guid clientId, AssignPackageRequest request, CancellationToken ct = default)
    {
        var belongsToTrainer = await _db.ClientInvites.AsNoTracking()
            .AnyAsync(i => i.ClientId == clientId && i.TrainerId == trainerId, ct);
        if (!belongsToTrainer)
            return new AssignPackageResult(false, "Client not found.", null);

        var package = await _db.Packages.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PackageId && p.TrainerId == trainerId, ct);
        if (package is null)
            return new AssignPackageResult(false, "Package not found.", null);

        if (request.SessionCount <= 0)
            return new AssignPackageResult(false, "Session count is required when a package is selected.", null);

        if (request.IsPaid && request.Method is null)
            return new AssignPackageResult(false, "Ödeme yöntemi seçilmelidir.", null);

        var userPackage = CreateUserPackageAndPayment(clientId, request.PackageId, package, request.SessionCount, request.IsPaid, request.Method);

        await _notificationService.PackageAssignedAsync(trainerId, clientId, package.Title, request.SessionCount, ct);

        await _db.SaveChangesAsync(ct);

        return new AssignPackageResult(true, null, userPackage.Id);
    }

    private UserPackage CreateUserPackageAndPayment(Guid clientId, Guid packageId, Package package, int sessionCount, bool isPaid, PaymentMethod? method)
    {
        var userPackage = new UserPackage
        {
            ClientId = clientId,
            PackageId = packageId,
            TotalSessions = sessionCount,
            RemainingSessions = sessionCount,
            IsActive = isPaid,
        };
        _db.UserPackages.Add(userPackage);

        _db.Payments.Add(new Payment
        {
            ClientId = clientId,
            PackageId = packageId,
            UserPackageId = userPackage.Id,
            MerchantOid = $"MANUAL-{Guid.NewGuid():N}",
            Amount = package.Price,
            IsSuccess = isPaid,
            Method = isPaid ? method : null,
        });

        return userPackage;
    }

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

    private static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
}
