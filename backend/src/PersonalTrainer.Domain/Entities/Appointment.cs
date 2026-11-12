using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Domain.Entities;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public Guid ClientId { get; set; }
    public Guid UserPackageId { get; set; }
    public Guid LocationId { get; set; }

    public DateTime StartTime { get; set; } // UTC
    public DateTime EndTime { get; set; }   // UTC

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Locked;

    // 5 Dakikalık Rezervasyon Hak Süresi için
    public DateTime LockExpirationTime { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Trainer { get; set; } = null!;
    public User Client { get; set; } = null!;
    public UserPackage UserPackage { get; set; } = null!;
    public TrainerLocation Location { get; set; } = null!;
}
