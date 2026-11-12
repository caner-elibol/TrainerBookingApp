using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Booking;
using PersonalTrainer.Application.Clients;
using PersonalTrainer.Application.Packages;
using PersonalTrainer.Application.Payments;
using PersonalTrainer.Application.Reports;
using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Common;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/trainers")]
public class TrainersController : ApiControllerBase
{
    private readonly ITrainerOnboardingService _onboardingService;
    private readonly IAvailabilityService _availabilityService;
    private readonly IPackageService _packageService;
    private readonly IBookingService _bookingService;
    private readonly IPaymentService _paymentService;
    private readonly IReportsService _reportsService;
    private readonly IClientOnboardingService _clientOnboardingService;
    private readonly ILocationService _locationService;

    public TrainersController(
        ITrainerOnboardingService onboardingService,
        IAvailabilityService availabilityService,
        IPackageService packageService,
        IBookingService bookingService,
        IPaymentService paymentService,
        IReportsService reportsService,
        IClientOnboardingService clientOnboardingService,
        ILocationService locationService)
    {
        _onboardingService = onboardingService;
        _availabilityService = availabilityService;
        _packageService = packageService;
        _bookingService = bookingService;
        _paymentService = paymentService;
        _reportsService = reportsService;
        _clientOnboardingService = clientOnboardingService;
        _locationService = locationService;
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/clients")]
    public async Task<IActionResult> CreateClient(CreateClientRequest request, CancellationToken ct)
    {
        var result = await _clientOnboardingService.CreateClientAsync(CurrentUserId, request, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new { clientId = result.ClientId, inviteToken = result.InviteToken });
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/clients/{clientId:guid}/packages")]
    public async Task<IActionResult> AssignPackage(Guid clientId, AssignPackageRequest request, CancellationToken ct)
    {
        var result = await _clientOnboardingService.AssignPackageAsync(CurrentUserId, clientId, request, ct);
        return result.Success ? Ok(new { userPackageId = result.UserPackageId }) : BadRequest(new { error = result.Error });
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/onboarding")]
    public async Task<IActionResult> CompleteOnboarding(OnboardingRequest request, CancellationToken ct)
    {
        var result = await _onboardingService.CompleteOnboardingAsync(CurrentUserId, request, ct);
        if (!result.Success)
            return BadRequest(new { errors = result.Errors });

        return NoContent();
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/settings")]
    public async Task<ActionResult<TrainerSettingsResponse>> GetMySettings(CancellationToken ct)
    {
        var settings = await _onboardingService.GetSettingsAsync(CurrentUserId, ct);
        return settings is null ? NotFound() : Ok(settings);
    }

    [AllowAnonymous]
    [HttpGet("by-slug/{slug}")]
    public async Task<ActionResult<TrainerProfileDto>> GetBySlug(string slug, CancellationToken ct)
    {
        var profile = await _onboardingService.GetPublicProfileBySlugAsync(slug, ct);
        return profile is null ? NotFound() : Ok(profile);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPatch("me/calendar-slug")]
    public async Task<IActionResult> UpdateCalendarSlug(UpdateSlugRequest request, CancellationToken ct)
    {
        var result = await _onboardingService.UpdateCalendarSlugAsync(CurrentUserId, request.Slug, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new { slug = result.Slug });
    }

    [AllowAnonymous]
    [HttpGet("{trainerId:guid}/availability")]
    public async Task<ActionResult<IReadOnlyList<AvailableSlotDto>>> GetAvailability(
        Guid trainerId, [FromQuery] Guid locationId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var slots = await _availabilityService.GetAvailableSlotsAsync(trainerId, locationId, date, ct);
        return slots is null ? NotFound("Trainer has not completed onboarding.") : Ok(slots);
    }

    [AllowAnonymous]
    [HttpGet("{trainerId:guid}/busy-slots")]
    public async Task<ActionResult<IReadOnlyList<BusySlotDto>>> GetBusySlots(
        Guid trainerId, [FromQuery] DateOnly date, CancellationToken ct) =>
        Ok(await _availabilityService.GetBusySlotsAsync(trainerId, date, ct));

    [AllowAnonymous]
    [HttpGet("{trainerId:guid}/locations")]
    public async Task<ActionResult<IReadOnlyList<TrainerLocationDto>>> GetLocations(Guid trainerId, CancellationToken ct) =>
        Ok(await _locationService.GetLocationsAsync(trainerId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/locations")]
    public async Task<ActionResult<IReadOnlyList<TrainerLocationDto>>> GetMyLocations(CancellationToken ct) =>
        Ok(await _locationService.GetLocationsAsync(CurrentUserId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/locations")]
    public async Task<ActionResult<TrainerLocationDto>> CreateLocation(CreateLocationRequest request, CancellationToken ct) =>
        Ok(await _locationService.CreateLocationAsync(CurrentUserId, request.Name, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpDelete("me/locations/{locationId:guid}")]
    public async Task<IActionResult> DeleteLocation(Guid locationId, CancellationToken ct)
    {
        var result = await _locationService.DeleteLocationAsync(CurrentUserId, locationId, ct);
        return result.Success ? NoContent() : BadRequest(new { error = result.Error });
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/locations/travel-times")]
    public async Task<ActionResult<IReadOnlyList<LocationTravelTimeDto>>> GetMyLocationTravelTimes(CancellationToken ct) =>
        Ok(await _locationService.GetTravelTimesAsync(CurrentUserId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPut("me/locations/{locationId:guid}/travel-times")]
    public async Task<IActionResult> SetLocationTravelTime(Guid locationId, SetTravelTimeRequest request, CancellationToken ct)
    {
        var result = await _locationService.SetTravelTimeAsync(CurrentUserId, locationId, request.OtherLocationId, request.Minutes, ct);
        return result.Success ? Ok(result.TravelTime) : BadRequest(new { error = result.Error });
    }

    [AllowAnonymous]
    [HttpGet("{trainerId:guid}/packages")]
    public async Task<ActionResult<IReadOnlyList<PackageDto>>> GetPackages(Guid trainerId, CancellationToken ct)
    {
        return Ok(await _packageService.GetActiveForTrainerAsync(trainerId, ct));
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/my-packages")]
    public async Task<ActionResult<IReadOnlyList<MyPackageDto>>> GetMyPackagesForTrainer(Guid trainerId, CancellationToken ct)
    {
        return Ok(await _bookingService.GetMyPackagesForTrainerAsync(CurrentUserId, trainerId, ct));
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/my-packages/full")]
    public async Task<ActionResult<IReadOnlyList<MyPackageDetailDto>>> GetMyPackagesFullForTrainer(Guid trainerId, CancellationToken ct)
    {
        return Ok(await _bookingService.GetMyPackagesFullForTrainerAsync(CurrentUserId, trainerId, ct));
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/appointments")]
    public async Task<ActionResult<IReadOnlyList<AppointmentSummaryDto>>> GetMyAppointments(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] AppointmentStatus? status, CancellationToken ct)
    {
        var today = IstanbulClock.TodayIstanbul();
        var effectiveFrom = from ?? new DateOnly(today.Year, today.Month, 1);
        var effectiveTo = to ?? effectiveFrom.AddMonths(1).AddDays(-1);

        var appointments = await _bookingService.GetTrainerAppointmentsAsync(CurrentUserId, effectiveFrom, effectiveTo, status, ct);
        return Ok(appointments);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/dashboard-stats")]
    public async Task<ActionResult<TrainerDashboardStatsDto>> GetMyDashboardStats(CancellationToken ct) =>
        Ok(await _bookingService.GetTrainerDashboardStatsAsync(CurrentUserId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/clients")]
    public async Task<ActionResult<IReadOnlyList<TrainerClientSummaryDto>>> GetMyClients(CancellationToken ct) =>
        Ok(await _bookingService.GetMyClientsAsync(CurrentUserId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/clients/{clientId:guid}/history")]
    public async Task<ActionResult<ClientHistoryResponse>> GetClientHistory(Guid clientId, CancellationToken ct)
    {
        var history = await _bookingService.GetClientHistoryAsync(CurrentUserId, clientId, ct);
        return history is null ? NotFound() : Ok(history);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/payments")]
    public async Task<ActionResult<TrainerPaymentsSummaryDto>> GetMyPayments(CancellationToken ct) =>
        Ok(await _paymentService.GetTrainerPaymentsAsync(CurrentUserId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPatch("me/payments/{paymentId:guid}/mark-paid")]
    public async Task<IActionResult> MarkPaymentPaid(Guid paymentId, MarkPaymentPaidRequest request, CancellationToken ct)
    {
        var result = await _paymentService.MarkPaymentPaidAsync(CurrentUserId, paymentId, request.Method, ct);
        return result.Success ? NoContent() : BadRequest(new { error = result.Error });
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/reports")]
    public async Task<ActionResult<TrainerReportsResponse>> GetMyReports(CancellationToken ct) =>
        Ok(await _reportsService.GetTrainerReportsAsync(CurrentUserId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/clients/{clientId:guid}/goals")]
    public async Task<ActionResult<IReadOnlyList<ClientGoalDto>>> GetClientGoals(Guid clientId, CancellationToken ct)
    {
        var goals = await _bookingService.GetClientGoalsAsync(CurrentUserId, clientId, ct);
        return goals is null ? NotFound() : Ok(goals);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/clients/{clientId:guid}/goals")]
    public async Task<ActionResult<ClientGoalDto>> CreateClientGoal(Guid clientId, CreateClientGoalRequest request, CancellationToken ct)
    {
        var goal = await _bookingService.CreateClientGoalAsync(CurrentUserId, clientId, request, ct);
        return goal is null ? NotFound() : Ok(goal);
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/my-goals")]
    public async Task<ActionResult<IReadOnlyList<ClientGoalDto>>> GetMyGoals(Guid trainerId, CancellationToken ct) =>
        Ok(await _bookingService.GetMyGoalsAsync(CurrentUserId, trainerId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/clients/{clientId:guid}/notes")]
    public async Task<ActionResult<IReadOnlyList<ClientNoteDto>>> GetClientNotes(Guid clientId, CancellationToken ct)
    {
        var notes = await _bookingService.GetClientNotesAsync(CurrentUserId, clientId, ct);
        return notes is null ? NotFound() : Ok(notes);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/clients/{clientId:guid}/notes")]
    public async Task<ActionResult<ClientNoteDto>> CreateClientNote(Guid clientId, CreateClientNoteRequest request, CancellationToken ct)
    {
        var note = await _bookingService.CreateClientNoteAsync(CurrentUserId, clientId, request, ct);
        return note is null ? NotFound() : Ok(note);
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/my-notes")]
    public async Task<ActionResult<IReadOnlyList<ClientNoteDto>>> GetMyNotes(Guid trainerId, CancellationToken ct) =>
        Ok(await _bookingService.GetMyNotesAsync(CurrentUserId, trainerId, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPatch("me/settings/extended")]
    public async Task<IActionResult> UpdateExtendedSettings(UpdateExtendedSettingsRequest request, CancellationToken ct)
    {
        var success = await _onboardingService.UpdateExtendedSettingsAsync(CurrentUserId, request, ct);
        return success ? NoContent() : NotFound();
    }

    [AllowAnonymous]
    [HttpGet("by-slug/{slug}/reviews")]
    public async Task<ActionResult<IReadOnlyList<ReviewDto>>> GetPublicReviews(string slug, CancellationToken ct) =>
        Ok(await _onboardingService.GetPublicReviewsBySlugAsync(slug, ct));

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/my-review")]
    public async Task<ActionResult<ReviewDto>> GetMyReview(Guid trainerId, CancellationToken ct)
    {
        var review = await _bookingService.GetMyReviewAsync(CurrentUserId, trainerId, ct);
        return review is null ? NotFound() : Ok(review);
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpPut("{trainerId:guid}/my-review")]
    public async Task<ActionResult<ReviewDto>> UpsertMyReview(Guid trainerId, UpsertReviewRequest request, CancellationToken ct)
    {
        var review = await _bookingService.UpsertMyReviewAsync(CurrentUserId, trainerId, request, ct);
        return review is null ? NotFound() : Ok(review);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/clients/{clientId:guid}/body-metrics")]
    public async Task<ActionResult<IReadOnlyList<BodyMetricDto>>> GetClientBodyMetrics(Guid clientId, CancellationToken ct)
    {
        var metrics = await _bookingService.GetClientBodyMetricsAsync(CurrentUserId, clientId, ct);
        return metrics is null ? NotFound() : Ok(metrics);
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/clients/{clientId:guid}/body-metrics")]
    public async Task<ActionResult<BodyMetricDto>> CreateClientBodyMetric(Guid clientId, CreateBodyMetricRequest request, CancellationToken ct)
    {
        var metric = await _bookingService.CreateBodyMetricAsync(CurrentUserId, clientId, request, ct);
        return metric is null ? NotFound() : Ok(metric);
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/my-body-metrics")]
    public async Task<ActionResult<IReadOnlyList<BodyMetricDto>>> GetMyBodyMetrics(Guid trainerId, CancellationToken ct) =>
        Ok(await _bookingService.GetMyBodyMetricsAsync(CurrentUserId, trainerId, ct));

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("{trainerId:guid}/favorite")]
    public async Task<ActionResult<bool>> GetFavorite(Guid trainerId, CancellationToken ct) =>
        Ok(await _bookingService.GetFavoriteStatusAsync(CurrentUserId, trainerId, ct));

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpPut("{trainerId:guid}/favorite")]
    public async Task<IActionResult> AddFavorite(Guid trainerId, CancellationToken ct)
    {
        await _bookingService.SetFavoriteAsync(CurrentUserId, trainerId, true, ct);
        return NoContent();
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpDelete("{trainerId:guid}/favorite")]
    public async Task<IActionResult> RemoveFavorite(Guid trainerId, CancellationToken ct)
    {
        await _bookingService.SetFavoriteAsync(CurrentUserId, trainerId, false, ct);
        return NoContent();
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/clients/{clientId:guid}/appointments")]
    public async Task<IActionResult> BookForClient(Guid clientId, BookForClientBody body, CancellationToken ct)
    {
        var result = await _bookingService.BookForClientAsync(
            CurrentUserId, new BookForClientRequest(clientId, body.UserPackageId, body.LocationId, body.StartTimeUtc), ct);

        return result.Success ? Ok(new { appointmentId = result.AppointmentId }) : BadRequest(new { error = result.Error });
    }

    public record BookForClientBody(Guid UserPackageId, Guid LocationId, DateTime StartTimeUtc);

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPatch("me/appointments/{id:guid}/attendance")]
    public async Task<IActionResult> MarkAttendance(Guid id, MarkAttendanceRequest request, CancellationToken ct)
    {
        var result = await _bookingService.MarkAttendanceAsync(CurrentUserId, id, request.Attended, ct);
        return result.Success ? NoContent() : BadRequest(new { error = result.Error });
    }

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/upcoming-birthdays")]
    public async Task<ActionResult<IReadOnlyList<UpcomingBirthdayDto>>> GetUpcomingBirthdays(CancellationToken ct) =>
        Ok(await _bookingService.GetUpcomingBirthdaysAsync(CurrentUserId, ct: ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpGet("me/calendar/closed-days")]
    public async Task<ActionResult<IReadOnlyList<ClosedDayDto>>> GetClosedDays(
        [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct) =>
        Ok(await _availabilityService.GetClosedDaysAsync(CurrentUserId, from, to, ct));

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPut("me/calendar/day-status")]
    public async Task<IActionResult> SetDayClosed([FromQuery] DateOnly date, SetDayClosedBody body, CancellationToken ct)
    {
        await _availabilityService.SetDayClosedAsync(CurrentUserId, date, body.Closed, ct: ct);
        return NoContent();
    }

    public record SetDayClosedBody(bool Closed);

    [Authorize(Roles = nameof(UserRole.Trainer))]
    [HttpPost("me/calendar/cancel-remaining")]
    public async Task<IActionResult> CancelRemainingAppointments([FromQuery] DateOnly date, CancellationToken ct)
    {
        var result = await _bookingService.CancelRemainingAppointmentsAsync(CurrentUserId, date, ct);
        return result.Success
            ? Ok(new { cancelledCount = result.CancelledCount })
            : BadRequest(new { error = result.Error });
    }
}
