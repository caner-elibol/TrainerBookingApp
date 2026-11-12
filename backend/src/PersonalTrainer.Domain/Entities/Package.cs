namespace PersonalTrainer.Domain.Entities;

public class Package
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SessionCount { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Trainer { get; set; } = null!;
    public ICollection<UserPackage> SoldPackages { get; set; } = new List<UserPackage>();
}
