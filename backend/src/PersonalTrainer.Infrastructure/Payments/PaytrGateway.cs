using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PersonalTrainer.Application.Payments;

namespace PersonalTrainer.Infrastructure.Payments;

public class PaytrGateway : IPaytrGateway
{
    private const string TokenEndpoint = "https://www.paytr.com/odeme/api/get-token";
    private const string NoInstallment = "0";
    private const string MaxInstallment = "0";

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;
    private readonly PaytrOptions _options;

    public PaytrGateway(HttpClient httpClient, IOptions<PaytrOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<PaytrTokenResult> GetIframeTokenAsync(PaytrTokenParams parameters, CancellationToken ct = default)
    {
        var userBasketJson = JsonSerializer.Serialize(
            parameters.Basket.Select(i => new object[] { i.Name, i.UnitPrice.ToString("F2"), i.Quantity }));
        var userBasketBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(userBasketJson));

        var testMode = _options.TestMode ? "1" : "0";
        var paymentAmount = parameters.PaymentAmountKurus.ToString();

        var hashStr =
            _options.MerchantId + parameters.UserIp + parameters.MerchantOid + parameters.Email +
            paymentAmount + userBasketBase64 + NoInstallment + MaxInstallment + _options.Currency + testMode;

        var paytrToken = PaytrHasher.ComputeHmacSha256Base64(hashStr + _options.MerchantSalt, _options.MerchantKey);

        var form = new Dictionary<string, string>
        {
            ["merchant_id"] = _options.MerchantId,
            ["user_ip"] = parameters.UserIp,
            ["merchant_oid"] = parameters.MerchantOid,
            ["email"] = parameters.Email,
            ["payment_amount"] = paymentAmount,
            ["paytr_token"] = paytrToken,
            ["user_basket"] = userBasketBase64,
            ["no_installment"] = NoInstallment,
            ["max_installment"] = MaxInstallment,
            ["currency"] = _options.Currency,
            ["test_mode"] = testMode,
            ["user_name"] = parameters.UserName,
            ["user_address"] = parameters.UserAddress,
            ["user_phone"] = parameters.UserPhone,
            ["merchant_ok_url"] = _options.MerchantOkUrl,
            ["merchant_fail_url"] = _options.MerchantFailUrl,
            ["timeout_limit"] = "30",
            ["debug_on"] = "0",
            ["lang"] = "tr",
        };

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.PostAsync(TokenEndpoint, new FormUrlEncodedContent(form), ct);
        }
        catch (HttpRequestException ex)
        {
            return new PaytrTokenResult(false, null, $"Could not reach PayTR: {ex.Message}");
        }

        using var _ = response;
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            return new PaytrTokenResult(false, null, $"PayTR request failed ({(int)response.StatusCode}): {body}");

        PaytrTokenResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<PaytrTokenResponse>(body, JsonOptions);
        }
        catch (JsonException)
        {
            return new PaytrTokenResult(false, null, $"Unexpected PayTR response: {body}");
        }

        if (parsed is null)
            return new PaytrTokenResult(false, null, "Empty PayTR response.");

        return parsed.Status == "success"
            ? new PaytrTokenResult(true, parsed.Token, null)
            : new PaytrTokenResult(false, null, parsed.Reason ?? "PayTR rejected the request.");
    }

    private class PaytrTokenResponse
    {
        public string? Status { get; set; }
        public string? Token { get; set; }
        public string? Reason { get; set; }
    }
}
