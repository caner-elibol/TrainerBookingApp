namespace PersonalTrainer.Infrastructure.Payments;

public class PaytrOptions
{
    public const string SectionName = "Paytr";

    public string MerchantId { get; set; } = string.Empty;
    public string MerchantKey { get; set; } = string.Empty;
    public string MerchantSalt { get; set; } = string.Empty;
    public bool TestMode { get; set; } = true;
    public string MerchantOkUrl { get; set; } = string.Empty;
    public string MerchantFailUrl { get; set; } = string.Empty;
    public string Currency { get; set; } = "TL";
    public bool UseFakeGateway { get; set; } = false;
}
