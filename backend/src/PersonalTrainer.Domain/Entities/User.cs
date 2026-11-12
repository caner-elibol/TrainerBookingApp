using Microsoft.AspNetCore.Identity;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }

    // PT'ye özel takvim takma adı / slug (örn: app.com/pt/ahmet-yilmaz)
    public string? CalendarSlug { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateOnly? DateOfBirth { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public decimal? HeightCm { get; set; }

    public string? PendingEmailCode { get; set; }
    public DateTime? PendingEmailCodeExpiresAt { get; set; }

    // Navigation Properties
    public ICollection<Package> CreatedPackages { get; set; } = new List<Package>();
    public ICollection<UserPackage> PurchasedPackages { get; set; } = new List<UserPackage>();
    public ICollection<Appointment> ClientAppointments { get; set; } = new List<Appointment>();
    public ICollection<Appointment> TrainerAppointments { get; set; } = new List<Appointment>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
