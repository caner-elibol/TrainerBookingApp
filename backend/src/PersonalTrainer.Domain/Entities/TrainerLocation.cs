namespace PersonalTrainer.Domain.Entities;

public class TrainerLocation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public User Trainer { get; set; } = null!;
}
