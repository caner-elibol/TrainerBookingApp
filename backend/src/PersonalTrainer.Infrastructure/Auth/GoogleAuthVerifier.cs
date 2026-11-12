using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using PersonalTrainer.Application.Auth;

namespace PersonalTrainer.Infrastructure.Auth;

public class GoogleAuthVerifier : IExternalAuthVerifier
{
    private readonly GoogleOptions _options;

    public string Provider => "Google";

    public GoogleAuthVerifier(IOptions<GoogleOptions> options)
    {
        _options = options.Value;
    }

    public async Task<ExternalAuthResult> VerifyAsync(string idToken, CancellationToken ct = default)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { _options.ClientId },
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        return new ExternalAuthResult(payload.Subject, payload.Email, payload.Name);
    }
}
