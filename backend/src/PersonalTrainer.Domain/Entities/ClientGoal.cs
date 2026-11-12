namespace PersonalTrainer.Domain.Entities;

public class ClientGoal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public Guid ClientId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int PercentComplete { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Trainer { get; set; } = null!;
    public User Client { get; set; } = null!;
}
