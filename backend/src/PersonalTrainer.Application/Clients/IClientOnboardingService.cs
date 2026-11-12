using PersonalTrainer.Application.Auth;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Clients;

public interface IClientOnboardingService
{
    Task<CreateClientResult> CreateClientAsync(Guid trainerId, CreateClientRequest request, CancellationToken ct = default);

    Task<ResumeInviteResult> ResumeInviteAsync(string rawToken, CancellationToken ct = default);

    Task<AssignPackageResult> AssignPackageAsync(Guid trainerId, Guid clientId, AssignPackageRequest request, CancellationToken ct = default);
}

public record CreateClientRequest(
    string FullName, string? Phone, Guid? PackageId, int? SessionCount,
    bool IsPaid = false, PaymentMethod? Method = null);

public record CreateClientResult(bool Success, string? Error, Guid? ClientId, string? InviteToken);

public record ResumeInviteResult(bool Success, string? Error, bool IsNewAccount, AuthResponse? Auth);

public record AssignPackageRequest(Guid PackageId, int SessionCount, bool IsPaid, PaymentMethod? Method);

public record AssignPackageResult(bool Success, string? Error, Guid? UserPackageId);
