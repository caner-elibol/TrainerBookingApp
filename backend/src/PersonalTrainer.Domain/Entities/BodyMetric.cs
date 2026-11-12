namespace PersonalTrainer.Domain.Entities;

public class BodyMetric
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public Guid ClientId { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public decimal? WeightKg { get; set; }
    public decimal? ChestCm { get; set; }
    public decimal? WaistCm { get; set; }
    public decimal? HipCm { get; set; }
    public decimal? ArmCm { get; set; }
    public decimal? BodyFatPercent { get; set; }

    public User Trainer { get; set; } = null!;
    public User Client { get; set; } = null!;
}
