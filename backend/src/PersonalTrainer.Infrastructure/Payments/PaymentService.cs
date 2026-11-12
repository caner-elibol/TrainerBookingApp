using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PersonalTrainer.Application.Notifications;
using PersonalTrainer.Application.Payments;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;
using PersonalTrainer.Infrastructure.Common;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Payments;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly IPaytrGateway _gateway;
    private readonly PaytrOptions _options;
    private readonly ILogger<PaymentService> _logger;
    private readonly INotificationService _notificationService;

    public PaymentService(
        AppDbContext db, IPaytrGateway gateway, IOptions<PaytrOptions> options, ILogger<PaymentService> logger,
        INotificationService notificationService)
    {
        _db = db;
        _gateway = gateway;
        _options = options.Value;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<PurchaseResult> InitiatePurchaseAsync(Guid clientId, Guid packageId, string userIp, CancellationToken ct = default)
    {
        var client = await _db.Users.FirstOrDefaultAsync(u => u.Id == clientId, ct);
        var package = await _db.Packages.FirstOrDefaultAsync(p => p.Id == packageId && p.IsActive, ct);

        if (client is null || package is null)
            return new PurchaseResult(false, "Package not found.", null, null);

        var merchantOid = Guid.NewGuid().ToString("N");
        var payment = new Payment
        {
            ClientId = clientId,
            PackageId = packageId,
            MerchantOid = merchantOid,
            Amount = package.Price,
            IsSuccess = false,
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(ct);

        var tokenParams = new PaytrTokenParams(
            MerchantOid: merchantOid,
            Email: client.Email ?? string.Empty,
            PaymentAmountKurus: (int)Math.Round(package.Price * 100),
            Basket: [new PaytrBasketItem(package.Title, package.Price, 1)],
            UserIp: userIp,
            UserName: client.FullName,
            UserAddress: "N/A",
            UserPhone: client.PhoneNumber ?? "N/A");

        var tokenResult = await _gateway.GetIframeTokenAsync(tokenParams, ct);
        if (!tokenResult.Success)
        {
            _logger.LogWarning("PayTR token request failed for MerchantOid {MerchantOid}: {Error}", merchantOid, tokenResult.Error);
            payment.ErrorMessage = tokenResult.Error;
            await _db.SaveChangesAsync(ct);
            return new PurchaseResult(false, tokenResult.Error, merchantOid, null);
        }

        return new PurchaseResult(true, null, merchantOid, tokenResult.Token);
    }

    public async Task<WebhookProcessResult> ProcessWebhookAsync(PaytrWebhookPayload payload, CancellationToken ct = default)
    {
        var expectedHash = PaytrHasher.ComputeHmacSha256Base64(
            payload.MerchantOid + _options.MerchantSalt + payload.Status + payload.TotalAmount,
            _options.MerchantKey);

        if (expectedHash != payload.Hash)
            return new WebhookProcessResult(false, "Hash mismatch.");

        var payment = await _db.Payments
            .Include(p => p.Package)
            .FirstOrDefaultAsync(p => p.MerchantOid == payload.MerchantOid, ct);

        if (payment is null)
        {
            _logger.LogWarning("PayTR webhook for unknown MerchantOid {MerchantOid}", payload.MerchantOid);
            return new WebhookProcessResult(true, "Unknown merchant_oid.");
        }

        if (payment.IsSuccess)
            return new WebhookProcessResult(true, null);

        if (payload.Status != "success")
        {
            payment.ErrorMessage = payload.FailedReasonMsg ?? "Payment failed.";
            await _db.SaveChangesAsync(ct);
            return new WebhookProcessResult(true, null);
        }

        var claimed = await _db.Payments
            .Where(p => p.Id == payment.Id && !p.IsSuccess)
            .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.IsSuccess, true), ct);

        if (claimed == 0)
            return new WebhookProcessResult(true, null);

        var userPackage = new UserPackage
        {
            ClientId = payment.ClientId,
            PackageId = payment.PackageId,
            TotalSessions = payment.Package.SessionCount,
            RemainingSessions = payment.Package.SessionCount,
            IsActive = true,
        };

        _db.UserPackages.Add(userPackage);
        payment.UserPackageId = userPackage.Id;

        await _notificationService.PackagePurchasedAsync(
            payment.Package.TrainerId, payment.ClientId, payment.Package.Title, payment.Package.SessionCount, payment.Amount, ct);

        await _db.SaveChangesAsync(ct);
        return new WebhookProcessResult(true, null);
    }

    public async Task<MarkPaymentPaidResult> MarkPaymentPaidAsync(Guid trainerId, Guid paymentId, PaymentMethod method, CancellationToken ct = default)
    {
        var payment = await _db.Payments
            .Include(p => p.Package)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.Package.TrainerId == trainerId, ct);

        if (payment is null)
            return new MarkPaymentPaidResult(false, "Ödeme bulunamadı.");

        if (payment.IsSuccess)
            return new MarkPaymentPaidResult(false, "Bu ödeme zaten onaylanmış.");

        if (payment.ErrorMessage != null)
            return new MarkPaymentPaidResult(false, "Başarısız bir ödeme elle onaylanamaz.");

        if (payment.UserPackageId is null)
            return new MarkPaymentPaidResult(false, "Bu ödeme çevrimiçi olarak beklemede, elle onaylanamaz.");

        var claimed = await _db.Payments
            .Where(p => p.Id == payment.Id && !p.IsSuccess)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.IsSuccess, true)
                .SetProperty(p => p.Method, method), ct);

        if (claimed == 0)
            return new MarkPaymentPaidResult(false, "Bu ödeme zaten işlendi.");

        await _db.UserPackages
            .Where(up => up.Id == payment.UserPackageId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(up => up.IsActive, true), ct);

        await _notificationService.PaymentReceivedAsync(trainerId, payment.ClientId, payment.Package.Title, payment.Amount, method, ct);
        await _db.SaveChangesAsync(ct);

        return new MarkPaymentPaidResult(true, null);
    }

    public async Task<TrainerPaymentsSummaryDto> GetTrainerPaymentsAsync(Guid trainerId, CancellationToken ct = default)
    {
        var rows = await _db.Payments.AsNoTracking()
            .Where(p => p.Package.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new TrainerPaymentDto(
                p.Id,
                p.ClientId,
                p.Client.FullName,
                p.Package.Title,
                p.Amount,
                p.IsSuccess ? "Paid" : (p.ErrorMessage != null ? "Failed" : "Pending"),
                p.Method != null ? p.Method.ToString() : null,
                p.CreatedAt))
            .ToListAsync(ct);

        var now = IstanbulClock.ConvertUtcToLocal(DateTime.UtcNow);
        var paidThisMonth = rows
            .Where(p => p.Status == "Paid" && p.CreatedAtUtc.Year == now.Year && p.CreatedAtUtc.Month == now.Month)
            .Sum(p => p.Amount);

        var paid = rows.Where(p => p.Status == "Paid").ToList();

        return new TrainerPaymentsSummaryDto(
            PaidThisMonth: paidThisMonth,
            PaidCount: paid.Count,
            PendingCount: rows.Count(p => p.Status == "Pending"),
            FailedCount: rows.Count(p => p.Status == "Failed"),
            AverageAmount: paid.Count > 0 ? paid.Average(p => p.Amount) : 0,
            Payments: rows);
    }
}
