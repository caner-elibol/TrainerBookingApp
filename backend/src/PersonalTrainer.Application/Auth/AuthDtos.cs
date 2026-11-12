using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Auth;

public record RequestOtpRequest(string Phone);

public record VerifyOtpRequest(string Phone, string Code, string? FullName, UserRole? Role);

public record OtpVerifyResponse(bool RequiresRegistration, AuthResponse? Auth);

public record RefreshRequest(string RefreshToken);

public record ExternalLoginRequest(string Provider, string IdToken, UserRole Role);

public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc);
