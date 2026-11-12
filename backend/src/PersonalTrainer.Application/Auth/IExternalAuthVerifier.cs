namespace PersonalTrainer.Application.Auth;

public record ExternalAuthResult(string ProviderKey, string Email, string? FullName);

public interface IExternalAuthVerifier
{
    string Provider { get; }

    Task<ExternalAuthResult> VerifyAsync(string idToken, CancellationToken ct = default);
}
