using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Trainers;

public record WorkingHourDto(
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    TimeSpan? BreakStartTime,
    TimeSpan? BreakEndTime);

public record OnboardingRequest(
    string ExpertiseArea,
    int SessionDurationMinutes,
    int BufferDurationMinutes,
    IReadOnlyList<WorkingHourDto> WorkingHours);

public record OnboardingResult(bool Success, IReadOnlyList<string> Errors);

public record TrainerSettingsResponse(
    string ExpertiseArea,
    int SessionDurationMinutes,
    int BufferDurationMinutes,
    IReadOnlyList<WorkingHourDto> WorkingHours,
    string? CalendarSlug,
    string Bio,
    IReadOnlyList<string> Specialties,
    int YearsExperience,
    decimal MonthlyRevenueTarget,
    int MonthlyActiveClientTarget,
    int MonthlyRenewalTargetPercent,
    bool NotifyPushEnabled,
    bool NotifyEmailEnabled,
    bool NotifyPaymentEnabled,
    string? PaytrMerchantId,
    string? PaytrMerchantKey,
    string? PaytrMerchantSalt);

public record UpdateExtendedSettingsRequest(
    string Bio,
    IReadOnlyList<string> Specialties,
    int YearsExperience,
    decimal MonthlyRevenueTarget,
    int MonthlyActiveClientTarget,
    int MonthlyRenewalTargetPercent,
    bool NotifyPushEnabled,
    bool NotifyEmailEnabled,
    bool NotifyPaymentEnabled,
    string? PaytrMerchantId,
    string? PaytrMerchantKey,
    string? PaytrMerchantSalt);

public record AvailableSlotDto(DateTime StartTimeUtc, DateTime EndTimeUtc);

public record BusySlotDto(DateTime StartTimeUtc, DateTime EndTimeUtc);

public record ClosedDayDto(DateOnly Date, TrainerClosedDayReason Reason);

public record TrainerProfileDto(
    Guid TrainerId,
    string FullName,
    string ExpertiseArea,
    string CalendarSlug,
    string Bio,
    string? City,
    IReadOnlyList<string> Specialties,
    int YearsExperience,
    double? AverageRating,
    int ReviewCount);

public record UpdateSlugRequest(string Slug);

public record UpdateSlugResult(bool Success, string? Error, string? Slug);

public record ReviewDto(Guid Id, string ClientName, int Rating, string? Comment, DateTime CreatedAtUtc);

public record UpsertReviewRequest(int Rating, string? Comment);

public record UpcomingBirthdayDto(Guid ClientId, string ClientName, DateOnly DateOfBirth, int DaysUntil);
