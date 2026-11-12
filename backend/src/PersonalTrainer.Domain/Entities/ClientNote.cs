namespace PersonalTrainer.Domain.Entities;

public class ClientNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public Guid ClientId { get; set; }
    public string Body { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Trainer { get; set; } = null!;
    public User Client { get; set; } = null!;
}
