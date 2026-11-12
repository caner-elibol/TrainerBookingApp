using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PersonalTrainer.Application.Payments;

namespace PersonalTrainer.Infrastructure.Payments;

public class FakePaytrGateway : IPaytrGateway
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly PaytrOptions _options;
    private readonly ILogger<FakePaytrGateway> _logger;

    public FakePaytrGateway(IServiceScopeFactory scopeFactory, IOptions<PaytrOptions> options, ILogger<FakePaytrGateway> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<PaytrTokenResult> GetIframeTokenAsync(PaytrTokenParams parameters, CancellationToken ct = default)
    {
        _logger.LogWarning(
            "PayTR FAKE gateway active — auto-confirming purchase for MerchantOid {MerchantOid}. Must never run in Production.",
            parameters.MerchantOid);

        var totalAmount = parameters.PaymentAmountKurus.ToString();
        var hash = PaytrHasher.ComputeHmacSha256Base64(
            parameters.MerchantOid + _options.MerchantSalt + "success" + totalAmount, _options.MerchantKey);
        var payload = new PaytrWebhookPayload(parameters.MerchantOid, "success", totalAmount, hash, null);

        using var scope = _scopeFactory.CreateScope();
        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();
        await paymentService.ProcessWebhookAsync(payload, ct);

        return new PaytrTokenResult(true, "FAKE-TOKEN", null);
    }
}
