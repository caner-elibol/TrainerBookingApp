using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Email;

public class EmailDispatchSweepService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);
    private const int BatchSize = 20;
    private const int MaxAttempts = 5;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly EmailDispatchSignal _signal;
    private readonly EmailOptions _options;
    private readonly ILogger<EmailDispatchSweepService> _logger;

    public EmailDispatchSweepService(
        IServiceScopeFactory scopeFactory,
        EmailDispatchSignal signal,
        IOptions<EmailOptions> options,
        ILogger<EmailDispatchSweepService> logger)
    {
        _scopeFactory = scopeFactory;
        _signal = signal;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);
        var tick = timer.WaitForNextTickAsync(stoppingToken).AsTask();
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchPendingAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email dispatch sweep failed");
            }

            var wake = _signal.WaitAsync(stoppingToken);
            await Task.WhenAny(tick, wake);

            if (tick.IsCompleted)
                tick = timer.WaitForNextTickAsync(stoppingToken).AsTask();
        }
    }

    private async Task DispatchPendingAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var batch = await db.EmailOutboxMessages
            .Where(m => m.Status == EmailOutboxStatus.Pending && m.NextAttemptAt <= now)
            .OrderBy(m => m.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(ct);

        if (batch.Count == 0)
            return;

        if (_options.UseFakeSender)
        {
            foreach (var message in batch)
            {
                _logger.LogWarning(
                    "FAKE email sender active — no real email was sent. To: {To} | Subject: {Subject}",
                    message.ToAddress, message.Subject);
                message.Status = EmailOutboxStatus.Sent;
                message.Attempts++;
                message.LastAttemptAt = now;
                message.SentAt = now;
            }

            await db.SaveChangesAsync(ct);
            return;
        }

        var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.StartTls, ct);
            await client.AuthenticateAsync(_options.UserName, _options.Password, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP connection failed — deferring {Count} pending email(s)", batch.Count);
            foreach (var message in batch)
                RecordFailure(message, ex, now);

            await db.SaveChangesAsync(ct);
            client.Dispose();
            return;
        }

        try
        {
            foreach (var message in batch)
            {
                try
                {
                    var mime = new MimeMessage();
                    mime.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
                    mime.To.Add(MailboxAddress.Parse(message.ToAddress));
                    mime.Subject = message.Subject;
                    mime.Body = new BodyBuilder { HtmlBody = message.HtmlBody }.ToMessageBody();

                    await client.SendAsync(mime, ct);

                    message.Status = EmailOutboxStatus.Sent;
                    message.Attempts++;
                    message.LastAttemptAt = DateTime.UtcNow;
                    message.SentAt = DateTime.UtcNow;
                    message.LastError = null;
                }
                catch (Exception ex)
                {
                    RecordFailure(message, ex, DateTime.UtcNow);
                }
            }
        }
        finally
        {
            if (client.IsConnected)
                await client.DisconnectAsync(true, ct);
            client.Dispose();
        }

        await db.SaveChangesAsync(ct);
    }

    private void RecordFailure(Domain.Entities.EmailOutboxMessage message, Exception ex, DateTime now)
    {
        message.Attempts++;
        message.LastAttemptAt = now;
        message.LastError = ex.Message;

        if (message.Attempts >= MaxAttempts)
        {
            message.Status = EmailOutboxStatus.Failed;
            _logger.LogError(ex, "Email to {To} failed permanently after {Attempts} attempts", message.ToAddress, message.Attempts);
        }
        else
        {
            message.NextAttemptAt = now.AddMinutes(Math.Pow(2, message.Attempts));
            _logger.LogWarning(ex, "Email to {To} failed (attempt {Attempts}), retrying at {NextAttemptAt}", message.ToAddress, message.Attempts, message.NextAttemptAt);
        }
    }
}
