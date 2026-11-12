namespace PersonalTrainer.Application.Booking;

public record LockAppointmentRequest(Guid TrainerId, Guid UserPackageId, Guid LocationId, DateTime StartTimeUtc);

public record LockAppointmentResult(bool Success, string? Error, Guid? AppointmentId, DateTime? LockExpirationTimeUtc);

public record ConfirmAppointmentResult(bool Success, string? Error);

public record ReleaseAppointmentResult(bool Success, string? Error);

public record CancelAppointmentResult(bool Success, string? Error);

public record MarkAttendanceRequest(bool Attended);

public record MarkAttendanceResult(bool Success, string? Error);

public record BookForClientRequest(Guid ClientId, Guid UserPackageId, Guid LocationId, DateTime StartTimeUtc);

public record BookForClientResult(bool Success, string? Error, Guid? AppointmentId);

public record AppointmentSummaryDto(
    Guid Id,
    Guid ClientId,
    string ClientName,
    DateTime StartTimeUtc,
    DateTime EndTimeUtc,
    string Status,
    string LocationName);

public record MyPackageDto(
    Guid UserPackageId,
    Guid PackageId,
    string PackageTitle,
    int RemainingSessions,
    int TotalSessions);

public record MyPackageDetailDto(
    Guid UserPackageId,
    Guid PackageId,
    string PackageTitle,
    int RemainingSessions,
    int TotalSessions,
    string Status,
    DateTime PurchasedAtUtc);

public record ClientAppointmentSummaryDto(
    Guid Id,
    Guid TrainerId,
    string TrainerName,
    DateTime StartTimeUtc,
    DateTime EndTimeUtc,
    string Status);

public record TodayAppointmentLocationCountDto(Guid LocationId, string LocationName, int Count);

public record TrainerDashboardStatsDto(
    int TodayAppointmentCount,
    int TotalClients,
    decimal TotalRevenue,
    bool IsTodayClosed,
    IReadOnlyList<TodayAppointmentLocationCountDto> TodayByLocation);

public record CancelRemainingResult(bool Success, string? Error, int CancelledCount);

public record TrainerClientSummaryDto(Guid ClientId, string ClientName, int RemainingSessions, DateOnly? DateOfBirth, string? ActivePackageTitle);

public record ClientPackageHistoryDto(
    Guid UserPackageId,
    Guid PackageId,
    string PackageTitle,
    int TotalSessions,
    int RemainingSessions,
    bool IsActive,
    DateTime PurchasedAtUtc);

public record ClientPaymentHistoryDto(Guid PaymentId, string PackageTitle, decimal Amount, string Status, string? Method, DateTime CreatedAtUtc);

public record ClientHistoryResponse(
    string ClientName,
    string Email,
    string? Phone,
    string? City,
    DateOnly? DateOfBirth,
    IReadOnlyList<ClientPackageHistoryDto> Packages,
    IReadOnlyList<ClientPaymentHistoryDto> Payments);

public record MyTrainerSummaryDto(Guid TrainerId, string TrainerName, string CalendarSlug);

public record ClientGoalDto(Guid Id, string Label, string? Caption, int PercentComplete, DateTime CreatedAtUtc);

public record CreateClientGoalRequest(string Label, string? Caption, int PercentComplete);

public record ClientNoteDto(Guid Id, string AuthorName, string Body, IReadOnlyList<string> Tags, DateTime CreatedAtUtc);

public record CreateClientNoteRequest(string Body, IReadOnlyList<string> Tags);

public record BodyMetricDto(
    Guid Id,
    DateTime RecordedAtUtc,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? ArmCm,
    decimal? BodyFatPercent);

public record CreateBodyMetricRequest(
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? ArmCm,
    decimal? BodyFatPercent);
