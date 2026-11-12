using PersonalTrainer.Application.Auth;

namespace PersonalTrainer.Infrastructure.Auth;

public class AppleAuthVerifier : IExternalAuthVerifier
{
    public string Provider => "Apple";

    public Task<ExternalAuthResult> VerifyAsync(string idToken, CancellationToken ct = default)
    {
        throw new NotImplementedException("Apple Sign-In verification is not yet implemented.");
    }
}
