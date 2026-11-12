using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Application.Payments;

public record PurchaseResult(bool Success, string? Error, string? MerchantOid, string? IframeToken);

public record PaytrWebhookPayload(
    string MerchantOid,
    string Status,
    string TotalAmount,
    string Hash,
    string? FailedReasonMsg);

public record WebhookProcessResult(bool HashValid, string? Error);

public record TrainerPaymentDto(
    Guid PaymentId,
    Guid ClientId,
    string ClientName,
    string PackageTitle,
    decimal Amount,
    string Status,
    string? Method,
    DateTime CreatedAtUtc);

public record TrainerPaymentsSummaryDto(
    decimal PaidThisMonth,
    int PaidCount,
    int PendingCount,
    int FailedCount,
    decimal AverageAmount,
    IReadOnlyList<TrainerPaymentDto> Payments);

public record MarkPaymentPaidRequest(PaymentMethod Method);

public record MarkPaymentPaidResult(bool Success, string? Error);
