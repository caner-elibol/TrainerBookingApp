using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Booking;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ApiControllerBase
{
    private readonly IBookingService _bookingService;

    public AppointmentsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpPost("lock")]
    public async Task<IActionResult> Lock(LockAppointmentRequest request, CancellationToken ct)
    {
        var result = await _bookingService.LockSlotAsync(CurrentUserId, request, ct);
        if (!result.Success)
            return Conflict(new { error = result.Error });

        return Ok(new { appointmentId = result.AppointmentId, lockExpirationTimeUtc = result.LockExpirationTimeUtc });
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpPost("{appointmentId:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid appointmentId, CancellationToken ct)
    {
        var result = await _bookingService.ConfirmAsync(CurrentUserId, appointmentId, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpPost("{appointmentId:guid}/release")]
    public async Task<IActionResult> Release(Guid appointmentId, CancellationToken ct)
    {
        var result = await _bookingService.ReleaseAsync(CurrentUserId, appointmentId, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    [HttpPost("{appointmentId:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid appointmentId, [FromQuery] bool refundSession = true, CancellationToken ct = default)
    {
        var result = await _bookingService.CancelAsync(CurrentUserId, appointmentId, refundSession, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<ClientAppointmentSummaryDto>>> GetMyAppointments(CancellationToken ct)
    {
        return Ok(await _bookingService.GetClientAppointmentsAsync(CurrentUserId, ct));
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpGet("my-trainers")]
    public async Task<ActionResult<IReadOnlyList<MyTrainerSummaryDto>>> GetMyTrainers(CancellationToken ct) =>
        Ok(await _bookingService.GetMyTrainersAsync(CurrentUserId, ct));
}
