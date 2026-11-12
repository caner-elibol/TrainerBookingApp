namespace PersonalTrainer.Domain.Entities;

public class FavoriteTrainer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Guid TrainerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Client { get; set; } = null!;
    public User Trainer { get; set; } = null!;
}
