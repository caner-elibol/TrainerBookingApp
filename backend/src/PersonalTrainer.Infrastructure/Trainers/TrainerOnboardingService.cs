using System.Text;
using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Trainers;

public class TrainerOnboardingService : ITrainerOnboardingService
{
    public const string DefaultLocationName = "Ana Konum";

    private readonly AppDbContext _db;

    public TrainerOnboardingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<OnboardingResult> CompleteOnboardingAsync(Guid trainerId, OnboardingRequest request, CancellationToken ct = default)
    {
        var errors = Validate(request);
        if (errors.Count > 0)
            return new OnboardingResult(false, errors);

        var setting = await _db.TrainerSettings.FirstOrDefaultAsync(s => s.TrainerId == trainerId, ct);
        if (setting is null)
        {
            setting = new TrainerSetting { TrainerId = trainerId };
            _db.TrainerSettings.Add(setting);
        }

        setting.ExpertiseArea = request.ExpertiseArea;
        setting.SessionDurationMinutes = request.SessionDurationMinutes;
        setting.BufferDurationMinutes = request.BufferDurationMinutes;

        await _db.TrainerWorkingHours
            .Where(w => w.TrainerId == trainerId)
            .ExecuteDeleteAsync(ct);

        foreach (var wh in request.WorkingHours)
        {
            _db.TrainerWorkingHours.Add(new TrainerWorkingHour
            {
                TrainerId = trainerId,
                DayOfWeek = wh.DayOfWeek,
                StartTime = wh.StartTime,
                EndTime = wh.EndTime,
                BreakStartTime = wh.BreakStartTime,
                BreakEndTime = wh.BreakEndTime,
            });
        }

        await EnsureCalendarSlugAsync(trainerId, ct);

        var hasLocation = await _db.TrainerLocations.AnyAsync(l => l.TrainerId == trainerId, ct);
        if (!hasLocation)
            _db.TrainerLocations.Add(new TrainerLocation { TrainerId = trainerId, Name = DefaultLocationName, SortOrder = 0 });

        await _db.SaveChangesAsync(ct);
        return new OnboardingResult(true, Array.Empty<string>());
    }

    public async Task<TrainerProfileDto?> GetPublicProfileBySlugAsync(string slug, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.CalendarSlug == slug && u.Role == UserRole.Trainer, ct);
        if (user is null)
            return null;

        var setting = await _db.TrainerSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.TrainerId == user.Id, ct);

        var ratings = await _db.Reviews.AsNoTracking()
            .Where(r => r.TrainerId == user.Id)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        double? averageRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : null;

        return new TrainerProfileDto(
            user.Id,
            user.FullName,
            setting?.ExpertiseArea ?? string.Empty,
            user.CalendarSlug!,
            setting?.Bio ?? string.Empty,
            user.City,
            setting?.Specialties ?? Array.Empty<string>(),
            setting?.YearsExperience ?? 0,
            averageRating,
            ratings.Count);
    }

    public async Task<IReadOnlyList<ReviewDto>> GetPublicReviewsBySlugAsync(string slug, CancellationToken ct = default)
    {
        var trainerId = await _db.Users.AsNoTracking()
            .Where(u => u.CalendarSlug == slug && u.Role == UserRole.Trainer)
            .Select(u => (Guid?)u.Id)
            .FirstOrDefaultAsync(ct);
        if (trainerId is null)
            return Array.Empty<ReviewDto>();

        return await _db.Reviews.AsNoTracking()
            .Where(r => r.TrainerId == trainerId && r.Comment != null && r.Comment != string.Empty)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new ReviewDto(r.Id, r.Client.FullName, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<bool> UpdateExtendedSettingsAsync(Guid trainerId, UpdateExtendedSettingsRequest request, CancellationToken ct = default)
    {
        var setting = await _db.TrainerSettings.FirstOrDefaultAsync(s => s.TrainerId == trainerId, ct);
        if (setting is null)
            return false;

        setting.Bio = request.Bio;
        setting.Specialties = request.Specialties.ToArray();
        setting.YearsExperience = request.YearsExperience;
        setting.MonthlyRevenueTarget = request.MonthlyRevenueTarget;
        setting.MonthlyActiveClientTarget = request.MonthlyActiveClientTarget;
        setting.MonthlyRenewalTargetPercent = request.MonthlyRenewalTargetPercent;
        setting.NotifyPushEnabled = request.NotifyPushEnabled;
        setting.NotifyEmailEnabled = request.NotifyEmailEnabled;
        setting.NotifyPaymentEnabled = request.NotifyPaymentEnabled;
        setting.PaytrMerchantId = request.PaytrMerchantId;
        setting.PaytrMerchantKey = request.PaytrMerchantKey;
        setting.PaytrMerchantSalt = request.PaytrMerchantSalt;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<UpdateSlugResult> UpdateCalendarSlugAsync(Guid trainerId, string newSlug, CancellationToken ct = default)
    {
        var normalized = Slugify(newSlug);
        if (normalized.Length < 3 || normalized.Length > 50)
            return new UpdateSlugResult(false, "Slug must be between 3 and 50 characters (letters, numbers, hyphens).", null);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == trainerId, ct);
        if (user is null)
            return new UpdateSlugResult(false, "Trainer not found.", null);

        var taken = await _db.Users.AnyAsync(u => u.CalendarSlug == normalized && u.Id != trainerId, ct);
        if (taken)
            return new UpdateSlugResult(false, "That link is already taken.", null);

        user.CalendarSlug = normalized;
        await _db.SaveChangesAsync(ct);
        return new UpdateSlugResult(true, null, normalized);
    }

    private async Task EnsureCalendarSlugAsync(Guid trainerId, CancellationToken ct)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == trainerId, ct);
        if (!string.IsNullOrEmpty(user.CalendarSlug))
            return;

        var baseSlug = Slugify(user.FullName);
        if (baseSlug.Length == 0)
            baseSlug = "trainer";

        var candidate = baseSlug;
        var suffix = 1;
        while (await _db.Users.AnyAsync(u => u.CalendarSlug == candidate, ct))
        {
            suffix++;
            candidate = $"{baseSlug}-{suffix}";
        }

        user.CalendarSlug = candidate;
    }

    private static string Slugify(string input)
    {
        var lowered = input.Trim().ToLowerInvariant()
            .Replace('ı', 'i').Replace('İ', 'i')
            .Replace('ş', 's').Replace('ğ', 'g')
            .Replace('ü', 'u').Replace('ö', 'o').Replace('ç', 'c');

        var builder = new StringBuilder();
        var lastWasHyphen = false;
        foreach (var ch in lowered)
        {
            if (char.IsLetterOrDigit(ch) && ch < 128)
            {
                builder.Append(ch);
                lastWasHyphen = false;
            }
            else if (!lastWasHyphen && builder.Length > 0)
            {
                builder.Append('-');
                lastWasHyphen = true;
            }
        }

        return builder.ToString().TrimEnd('-');
    }

    public async Task<TrainerSettingsResponse?> GetSettingsAsync(Guid trainerId, CancellationToken ct = default)
    {
        var setting = await _db.TrainerSettings.AsNoTracking().FirstOrDefaultAsync(s => s.TrainerId == trainerId, ct);
        if (setting is null)
            return null;

        var workingHours = await _db.TrainerWorkingHours.AsNoTracking()
            .Where(w => w.TrainerId == trainerId)
            .OrderBy(w => w.DayOfWeek)
            .Select(w => new WorkingHourDto(w.DayOfWeek, w.StartTime, w.EndTime, w.BreakStartTime, w.BreakEndTime))
            .ToListAsync(ct);

        var calendarSlug = await _db.Users.AsNoTracking()
            .Where(u => u.Id == trainerId)
            .Select(u => u.CalendarSlug)
            .FirstOrDefaultAsync(ct);

        return new TrainerSettingsResponse(
            setting.ExpertiseArea,
            setting.SessionDurationMinutes,
            setting.BufferDurationMinutes,
            workingHours,
            calendarSlug,
            setting.Bio,
            setting.Specialties,
            setting.YearsExperience,
            setting.MonthlyRevenueTarget,
            setting.MonthlyActiveClientTarget,
            setting.MonthlyRenewalTargetPercent,
            setting.NotifyPushEnabled,
            setting.NotifyEmailEnabled,
            setting.NotifyPaymentEnabled,
            setting.PaytrMerchantId,
            setting.PaytrMerchantKey,
            setting.PaytrMerchantSalt);
    }

    private static List<string> Validate(OnboardingRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.ExpertiseArea))
            errors.Add("ExpertiseArea is required.");

        if (request.SessionDurationMinutes <= 0)
            errors.Add("SessionDurationMinutes must be greater than zero.");

        if (request.BufferDurationMinutes < 0)
            errors.Add("BufferDurationMinutes cannot be negative.");

        if (request.WorkingHours.Count == 0)
            errors.Add("At least one working day is required.");

        var seenDays = new HashSet<DayOfWeek>();
        foreach (var wh in request.WorkingHours)
        {
            if (!seenDays.Add(wh.DayOfWeek))
                errors.Add($"{wh.DayOfWeek}: duplicate working-hour entry.");

            if (wh.EndTime <= wh.StartTime)
                errors.Add($"{wh.DayOfWeek}: EndTime must be after StartTime.");

            if (wh.BreakStartTime.HasValue != wh.BreakEndTime.HasValue)
                errors.Add($"{wh.DayOfWeek}: BreakStartTime and BreakEndTime must be provided together.");

            if (wh.BreakStartTime.HasValue && wh.BreakEndTime.HasValue)
            {
                if (wh.BreakEndTime <= wh.BreakStartTime)
                    errors.Add($"{wh.DayOfWeek}: BreakEndTime must be after BreakStartTime.");

                if (wh.BreakStartTime < wh.StartTime || wh.BreakEndTime > wh.EndTime)
                    errors.Add($"{wh.DayOfWeek}: Break must fall within working hours.");
            }
        }

        return errors;
    }
}
