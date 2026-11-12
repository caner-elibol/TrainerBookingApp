namespace PersonalTrainer.Application.Realtime;

public interface IAvailabilityNotifier
{
    Task NotifySlotStatusChangedAsync(SlotStatusChangedMessage message, CancellationToken ct = default);
}
