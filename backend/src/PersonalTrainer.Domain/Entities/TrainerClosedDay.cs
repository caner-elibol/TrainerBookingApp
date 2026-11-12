using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Domain.Entities;

public class TrainerClosedDay
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public DateOnly Date { get; set; }
    public TrainerClosedDayReason Reason { get; set; } = TrainerClosedDayReason.Manual;

    public User Trainer { get; set; } = null!;
}
