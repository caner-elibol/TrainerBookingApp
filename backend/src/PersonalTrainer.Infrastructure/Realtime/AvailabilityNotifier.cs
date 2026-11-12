using Microsoft.AspNetCore.SignalR;
using PersonalTrainer.Application.Realtime;

namespace PersonalTrainer.Infrastructure.Realtime;

public class AvailabilityNotifier : IAvailabilityNotifier
{
    private readonly IHubContext<AvailabilityHub> _hubContext;

    public AvailabilityNotifier(IHubContext<AvailabilityHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifySlotStatusChangedAsync(SlotStatusChangedMessage message, CancellationToken ct = default)
    {
        var group = AvailabilityHub.TrainerGroupName(message.TrainerId);
        return _hubContext.Clients.Group(group).SendAsync("SlotStatusChanged", message, ct);
    }
}
