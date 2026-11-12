using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public Guid PackageId { get; set; }

    public Guid? UserPackageId { get; set; }

    public string MerchantOid { get; set; } = string.Empty; // PayTR Sipariş No
    public decimal Amount { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }

    public PaymentMethod? Method { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User Client { get; set; } = null!;
    public Package Package { get; set; } = null!;
    public UserPackage? UserPackage { get; set; }
}
