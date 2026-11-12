namespace PersonalTrainer.Application.Trainers;

public interface ILocationService
{
    Task<IReadOnlyList<TrainerLocationDto>> GetLocationsAsync(Guid trainerId, CancellationToken ct = default);

    Task<TrainerLocationDto> CreateLocationAsync(Guid trainerId, string name, CancellationToken ct = default);

    Task<DeleteLocationResult> DeleteLocationAsync(Guid trainerId, Guid locationId, CancellationToken ct = default);

    Task<IReadOnlyList<LocationTravelTimeDto>> GetTravelTimesAsync(Guid trainerId, CancellationToken ct = default);

    Task<SetTravelTimeResult> SetTravelTimeAsync(
        Guid trainerId, Guid locationId, Guid otherLocationId, int minutes, CancellationToken ct = default);
}
