using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Clients;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/invites")]
[AllowAnonymous]
public class InvitesController : ControllerBase
{
    private readonly IClientOnboardingService _clientOnboardingService;

    public InvitesController(IClientOnboardingService clientOnboardingService)
    {
        _clientOnboardingService = clientOnboardingService;
    }

    [HttpPost("{token}/resume")]
    public async Task<IActionResult> Resume(string token, CancellationToken ct)
    {
        var result = await _clientOnboardingService.ResumeInviteAsync(token, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new { isNewAccount = result.IsNewAccount, auth = result.Auth });
    }
}
