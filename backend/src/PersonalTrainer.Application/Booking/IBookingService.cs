using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Booking;

public interface IBookingService
{
    Task<LockAppointmentResult> LockSlotAsync(Guid clientId, LockAppointmentRequest request, CancellationToken ct = default);

    Task<ConfirmAppointmentResult> ConfirmAsync(Guid clientId, Guid appointmentId, CancellationToken ct = default);

    Task<BookForClientResult> BookForClientAsync(Guid trainerId, BookForClientRequest request, CancellationToken ct = default);

    Task<ReleaseAppointmentResult> ReleaseAsync(Guid clientId, Guid appointmentId, CancellationToken ct = default);

    Task<CancelAppointmentResult> CancelAsync(Guid userId, Guid appointmentId, bool refundSession = true, CancellationToken ct = default);

    Task<MarkAttendanceResult> MarkAttendanceAsync(Guid trainerId, Guid appointmentId, bool attended, CancellationToken ct = default);

    Task<IReadOnlyList<AppointmentSummaryDto>> GetTrainerAppointmentsAsync(
        Guid trainerId, DateOnly from, DateOnly to, AppointmentStatus? status, CancellationToken ct = default);

    Task<IReadOnlyList<MyPackageDto>> GetMyPackagesForTrainerAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<MyPackageDetailDto>> GetMyPackagesFullForTrainerAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<ClientAppointmentSummaryDto>> GetClientAppointmentsAsync(Guid clientId, CancellationToken ct = default);

    Task<TrainerDashboardStatsDto> GetTrainerDashboardStatsAsync(Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<TrainerClientSummaryDto>> GetMyClientsAsync(Guid trainerId, CancellationToken ct = default);

    Task<ClientHistoryResponse?> GetClientHistoryAsync(Guid trainerId, Guid clientId, CancellationToken ct = default);

    Task<IReadOnlyList<MyTrainerSummaryDto>> GetMyTrainersAsync(Guid clientId, CancellationToken ct = default);

    Task<IReadOnlyList<ClientGoalDto>?> GetClientGoalsAsync(Guid trainerId, Guid clientId, CancellationToken ct = default);

    Task<ClientGoalDto?> CreateClientGoalAsync(Guid trainerId, Guid clientId, CreateClientGoalRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<ClientGoalDto>> GetMyGoalsAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<ClientNoteDto>?> GetClientNotesAsync(Guid trainerId, Guid clientId, CancellationToken ct = default);

    Task<ClientNoteDto?> CreateClientNoteAsync(Guid trainerId, Guid clientId, CreateClientNoteRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<ClientNoteDto>> GetMyNotesAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<BodyMetricDto>?> GetClientBodyMetricsAsync(Guid trainerId, Guid clientId, CancellationToken ct = default);

    Task<BodyMetricDto?> CreateBodyMetricAsync(Guid trainerId, Guid clientId, CreateBodyMetricRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<BodyMetricDto>> GetMyBodyMetricsAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<UpcomingBirthdayDto>> GetUpcomingBirthdaysAsync(Guid trainerId, int withinDays = 30, CancellationToken ct = default);

    Task<ReviewDto?> GetMyReviewAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task<ReviewDto?> UpsertMyReviewAsync(Guid clientId, Guid trainerId, UpsertReviewRequest request, CancellationToken ct = default);

    Task<bool> GetFavoriteStatusAsync(Guid clientId, Guid trainerId, CancellationToken ct = default);

    Task SetFavoriteAsync(Guid clientId, Guid trainerId, bool favorite, CancellationToken ct = default);

    Task<CancelRemainingResult> CancelRemainingAppointmentsAsync(Guid trainerId, DateOnly date, CancellationToken ct = default);
}
