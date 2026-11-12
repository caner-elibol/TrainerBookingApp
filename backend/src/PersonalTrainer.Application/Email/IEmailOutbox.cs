namespace PersonalTrainer.Application.Email;

public interface IEmailOutbox
{
    void Enqueue(string toAddress, EmailTemplateKey key, IReadOnlyDictionary<string, string> tokens);
}
