namespace PersonalTrainer.Domain.Entities;

public class LocationTravelTime
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public Guid LocationAId { get; set; }
    public Guid LocationBId { get; set; }
    public int Minutes { get; set; }

    public User Trainer { get; set; } = null!;
    public TrainerLocation LocationA { get; set; } = null!;
    public TrainerLocation LocationB { get; set; } = null!;
}
