namespace PersonalTrainer.Application.Trainers;

public interface ITrainerOnboardingService
{
    Task<OnboardingResult> CompleteOnboardingAsync(Guid trainerId, OnboardingRequest request, CancellationToken ct = default);

    Task<TrainerSettingsResponse?> GetSettingsAsync(Guid trainerId, CancellationToken ct = default);

    Task<TrainerProfileDto?> GetPublicProfileBySlugAsync(string slug, CancellationToken ct = default);

    Task<UpdateSlugResult> UpdateCalendarSlugAsync(Guid trainerId, string newSlug, CancellationToken ct = default);

    Task<bool> UpdateExtendedSettingsAsync(Guid trainerId, UpdateExtendedSettingsRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<ReviewDto>> GetPublicReviewsBySlugAsync(string slug, CancellationToken ct = default);
}
