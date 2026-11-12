using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Trainers;

public interface IAvailabilityService
{
    Task<IReadOnlyList<AvailableSlotDto>?> GetAvailableSlotsAsync(Guid trainerId, Guid locationId, DateOnly date, CancellationToken ct = default);

    Task<IReadOnlyList<BusySlotDto>> GetBusySlotsAsync(Guid trainerId, DateOnly date, CancellationToken ct = default);

    Task<IReadOnlyList<ClosedDayDto>> GetClosedDaysAsync(Guid trainerId, DateOnly from, DateOnly to, CancellationToken ct = default);

    Task SetDayClosedAsync(Guid trainerId, DateOnly date, bool closed, TrainerClosedDayReason reason = TrainerClosedDayReason.Manual, CancellationToken ct = default);
}
