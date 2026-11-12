namespace PersonalTrainer.Application.Email;

public interface IEmailTemplateRenderer
{
    RenderedEmail Render(EmailTemplateKey key, IReadOnlyDictionary<string, string> tokens);
}
