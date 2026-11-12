using Microsoft.Extensions.Logging;
using PersonalTrainer.Application.Email;

namespace PersonalTrainer.Infrastructure.Email;

public class FakeEmailSender : IEmailSender
{
    private readonly ILogger<FakeEmailSender> _logger;

    public FakeEmailSender(ILogger<FakeEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        _logger.LogWarning(
            "FAKE email sender active — no real email was sent. To: {To} | Subject: {Subject} | Body: {Body}",
            to, subject, htmlBody);
        return Task.CompletedTask;
    }
}
