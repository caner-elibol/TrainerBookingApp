using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Payments;

public interface IPaymentService
{
    Task<PurchaseResult> InitiatePurchaseAsync(Guid clientId, Guid packageId, string userIp, CancellationToken ct = default);

    Task<WebhookProcessResult> ProcessWebhookAsync(PaytrWebhookPayload payload, CancellationToken ct = default);

    Task<TrainerPaymentsSummaryDto> GetTrainerPaymentsAsync(Guid trainerId, CancellationToken ct = default);

    Task<MarkPaymentPaidResult> MarkPaymentPaidAsync(Guid trainerId, Guid paymentId, PaymentMethod method, CancellationToken ct = default);
}
