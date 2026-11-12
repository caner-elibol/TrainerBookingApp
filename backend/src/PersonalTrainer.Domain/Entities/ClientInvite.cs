namespace PersonalTrainer.Domain.Entities;

public class ClientInvite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Guid TrainerId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    // Navigation Properties
    public User Client { get; set; } = null!;
    public User Trainer { get; set; } = null!;
}
