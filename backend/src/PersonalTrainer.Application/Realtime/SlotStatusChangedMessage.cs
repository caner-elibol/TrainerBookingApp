namespace PersonalTrainer.Application.Realtime;

public enum SlotStatus
{
    Selecting,
    Available,
    Booked,
}

public record SlotStatusChangedMessage(Guid TrainerId, DateTime StartTimeUtc, SlotStatus Status);
