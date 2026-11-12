namespace PersonalTrainer.Domain.Entities;

public class TrainerWorkingHour
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; } // 09:00
    public TimeSpan EndTime { get; set; }   // 20:00

    // Mola/Öğle yemeği arası (Opsiyonel)
    public TimeSpan? BreakStartTime { get; set; } // 13:00
    public TimeSpan? BreakEndTime { get; set; }   // 14:00

    public User Trainer { get; set; } = null!;
}
