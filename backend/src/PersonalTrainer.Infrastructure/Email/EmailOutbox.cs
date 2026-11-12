using PersonalTrainer.Application.Email;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Email;

public class EmailOutbox : IEmailOutbox
{
    private readonly AppDbContext _db;
    private readonly IEmailTemplateRenderer _renderer;
    private readonly EmailDispatchSignal _signal;

    public EmailOutbox(AppDbContext db, IEmailTemplateRenderer renderer, EmailDispatchSignal signal)
    {
        _db = db;
        _renderer = renderer;
        _signal = signal;
    }

    public void Enqueue(string toAddress, EmailTemplateKey key, IReadOnlyDictionary<string, string> tokens)
    {
        var rendered = _renderer.Render(key, tokens);
        _db.EmailOutboxMessages.Add(new EmailOutboxMessage
        {
            ToAddress = toAddress,
            Subject = rendered.Subject,
            HtmlBody = rendered.HtmlBody,
        });

        _signal.Release();
    }
}
