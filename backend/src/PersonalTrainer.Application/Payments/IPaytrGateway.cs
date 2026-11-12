namespace PersonalTrainer.Application.Payments;

public interface IPaytrGateway
{
    Task<PaytrTokenResult> GetIframeTokenAsync(PaytrTokenParams parameters, CancellationToken ct = default);
}
