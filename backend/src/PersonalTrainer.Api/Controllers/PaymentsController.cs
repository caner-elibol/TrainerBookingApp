using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalTrainer.Application.Payments;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ApiControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [Authorize(Roles = nameof(UserRole.Client))]
    [HttpPost("purchase")]
    public async Task<IActionResult> Purchase(PurchasePackageRequest request, CancellationToken ct)
    {
        var userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _paymentService.InitiatePurchaseAsync(CurrentUserId, request.PackageId, userIp, ct);

        if (!result.Success)
            return BadRequest(new { error = result.Error, merchantOid = result.MerchantOid });

        return Ok(new { merchantOid = result.MerchantOid, iframeToken = result.IframeToken });
    }

    [AllowAnonymous]
    [HttpPost("paytr/webhook")]
    public async Task<IActionResult> PaytrWebhook([FromForm] PaytrWebhookForm form, CancellationToken ct)
    {
        var payload = new PaytrWebhookPayload(form.merchant_oid, form.status, form.total_amount, form.hash, form.failed_reason_msg);
        var result = await _paymentService.ProcessWebhookAsync(payload, ct);

        if (!result.HashValid)
            return BadRequest("bad hash");

        return Content("OK", "text/plain");
    }
}

public record PurchasePackageRequest(Guid PackageId);

public class PaytrWebhookForm
{
    public string merchant_oid { get; set; } = string.Empty;
    public string status { get; set; } = string.Empty;
    public string total_amount { get; set; } = string.Empty;
    public string hash { get; set; } = string.Empty;
    public string? failed_reason_code { get; set; }
    public string? failed_reason_msg { get; set; }
    public string? payment_type { get; set; }
    public string? currency { get; set; }
    public string? payment_amount { get; set; }
    public string? test_mode { get; set; }
}
