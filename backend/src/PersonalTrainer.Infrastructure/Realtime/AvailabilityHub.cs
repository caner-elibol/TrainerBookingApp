using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace PersonalTrainer.Infrastructure.Realtime;

public class AvailabilityHub : Hub
{
    private readonly ILogger<AvailabilityHub> _logger;

    public AvailabilityHub(ILogger<AvailabilityHub> logger)
    {
        _logger = logger;
    }

    public static string TrainerGroupName(Guid trainerId) => $"trainer-{trainerId}";

    public Task JoinTrainerCalendar(Guid trainerId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, TrainerGroupName(trainerId));

    public Task LeaveTrainerCalendar(Guid trainerId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, TrainerGroupName(trainerId));

    public override Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected to AvailabilityHub: {ConnectionId}", Context.ConnectionId);
        return base.OnConnectedAsync();
    }
}
