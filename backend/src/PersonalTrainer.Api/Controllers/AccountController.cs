using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Account;
using PersonalTrainer.Application.Common;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController : ApiControllerBase
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<AccountProfileDto>> GetMe(CancellationToken ct)
    {
        var profile = await _accountService.GetProfileAsync(CurrentUserId, ct);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPatch("me")]
    public async Task<ActionResult<AccountProfileDto>> UpdateMe(UpdateAccountProfileRequest request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.Phone) && PhoneNumber.Normalize(request.Phone) is null)
            return BadRequest(new { error = PhoneNumber.InvalidMessage });

        var profile = await _accountService.UpdateProfileAsync(CurrentUserId, request, ct);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPost("me/initial-weight")]
    public async Task<IActionResult> SetInitialWeight(SetInitialWeightRequest request, CancellationToken ct)
    {
        var result = await _accountService.SetInitialWeightAsync(CurrentUserId, request.WeightKg, ct);
        return result.Success ? NoContent() : BadRequest(new { error = result.Error });
    }

    [HttpPost("me/email")]
    public async Task<IActionResult> RequestEmailActivation(RequestEmailActivationRequest request, CancellationToken ct)
    {
        var result = await _accountService.RequestEmailActivationAsync(CurrentUserId, request.Email, ct);
        return result.Success ? NoContent() : BadRequest(new { error = result.Error });
    }

    [HttpPost("me/email/confirm")]
    public async Task<IActionResult> ConfirmEmailActivation(ConfirmEmailActivationRequest request, CancellationToken ct)
    {
        var result = await _accountService.ConfirmEmailActivationAsync(CurrentUserId, request.Code, ct);
        return result.Success ? NoContent() : BadRequest(new { error = result.Error });
    }
}
