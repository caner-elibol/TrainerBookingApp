namespace PersonalTrainer.Domain.Entities;

public class UserPackage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Guid PackageId { get; set; }

    public int TotalSessions { get; set; }
    public int RemainingSessions { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Client { get; set; } = null!;
    public Package Package { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
