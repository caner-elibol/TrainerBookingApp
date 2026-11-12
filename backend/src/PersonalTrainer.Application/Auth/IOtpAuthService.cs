using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Auth;

public record OtpVerifyResult(bool Success, string? Error, bool RequiresRegistration, AuthResponse? Auth);

public interface IOtpAuthService
{
    Task<OtpVerifyResult> VerifyAsync(string phone, string code, string? fullName, UserRole? role, CancellationToken ct = default);
}
