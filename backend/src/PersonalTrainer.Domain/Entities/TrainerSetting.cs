namespace PersonalTrainer.Domain.Entities;

public class TrainerSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }

    public string ExpertiseArea { get; set; } = string.Empty; // Fitness, Cycle vs.

    public int SessionDurationMinutes { get; set; } // Örn: 50
    public int BufferDurationMinutes { get; set; }  // Örn: 10

    public string Bio { get; set; } = string.Empty;
    public string[] Specialties { get; set; } = Array.Empty<string>();
    public int YearsExperience { get; set; }

    public decimal MonthlyRevenueTarget { get; set; }
    public int MonthlyActiveClientTarget { get; set; }
    public int MonthlyRenewalTargetPercent { get; set; }

    public bool NotifyPushEnabled { get; set; } = true;
    public bool NotifyEmailEnabled { get; set; } = true;
    public bool NotifyPaymentEnabled { get; set; } = true;

    public string? PaytrMerchantId { get; set; }
    public string? PaytrMerchantKey { get; set; }
    public string? PaytrMerchantSalt { get; set; }

    public User Trainer { get; set; } = null!;
}
