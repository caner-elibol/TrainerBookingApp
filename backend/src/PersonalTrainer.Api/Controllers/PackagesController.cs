using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Packages;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/packages")]
[Authorize(Roles = nameof(UserRole.Trainer))]
public class PackagesController : ApiControllerBase
{
    private readonly IPackageService _packageService;

    public PackagesController(IPackageService packageService)
    {
        _packageService = packageService;
    }

    [HttpPost]
    public async Task<ActionResult<PackageDto>> Create(CreatePackageRequest request, CancellationToken ct)
    {
        var package = await _packageService.CreateAsync(CurrentUserId, request, ct);
        return Ok(package);
    }

    [HttpPut("{packageId:guid}")]
    public async Task<ActionResult<PackageDto>> Update(Guid packageId, UpdatePackageRequest request, CancellationToken ct)
    {
        var package = await _packageService.UpdateAsync(CurrentUserId, packageId, request, ct);
        return package is null ? NotFound() : Ok(package);
    }

    [HttpPatch("{packageId:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid packageId, CancellationToken ct)
    {
        var success = await _packageService.DeactivateAsync(CurrentUserId, packageId, ct);
        return success ? NoContent() : NotFound();
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<PackageDto>>> GetMine(CancellationToken ct)
    {
        return Ok(await _packageService.GetMineAsync(CurrentUserId, ct));
    }

    [HttpGet("mine/insights")]
    public async Task<ActionResult<IReadOnlyList<PackageInsightDto>>> GetMyInsights(CancellationToken ct)
    {
        return Ok(await _packageService.GetMyInsightsAsync(CurrentUserId, ct));
    }
}
