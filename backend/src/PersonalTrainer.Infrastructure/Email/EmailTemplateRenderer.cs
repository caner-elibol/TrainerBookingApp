using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PersonalTrainer.Application.Email;

namespace PersonalTrainer.Infrastructure.Email;

public partial class EmailTemplateRenderer : IEmailTemplateRenderer
{
    private readonly IHostEnvironment _environment;
    private readonly ILogger<EmailTemplateRenderer> _logger;

    public EmailTemplateRenderer(IHostEnvironment environment, ILogger<EmailTemplateRenderer> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public RenderedEmail Render(EmailTemplateKey key, IReadOnlyDictionary<string, string> tokens)
    {
        if (!EmailTemplateCatalog.Templates.TryGetValue(key, out var template))
            throw new InvalidOperationException($"No email template registered for key '{key}'.");

        var subject = ReplaceTokens(template.Subject, tokens, key, "Subject", encode: false);
        var bodyContent = ReplaceTokens(template.Body, tokens, key, "Body", encode: true);

        return new RenderedEmail(subject, EmailTemplateCatalog.WrapLayout(bodyContent));
    }

    private string ReplaceTokens(
        string template, IReadOnlyDictionary<string, string> tokens, EmailTemplateKey key, string part, bool encode)
    {
        return TokenPattern().Replace(template, match =>
        {
            var name = match.Groups[1].Value;
            if (tokens.TryGetValue(name, out var value))
                return encode ? WebUtility.HtmlEncode(value) : value;

            var message = $"Email template '{key}' {part} is missing token '{{{{{name}}}}}'.";
            if (_environment.IsDevelopment())
                throw new InvalidOperationException(message);

            _logger.LogError(message);
            return string.Empty;
        });
    }

    [GeneratedRegex(@"\{\{(\w+)\}\}")]
    private static partial Regex TokenPattern();
}
