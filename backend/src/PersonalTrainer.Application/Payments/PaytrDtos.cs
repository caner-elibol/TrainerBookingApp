namespace PersonalTrainer.Application.Payments;

public record PaytrBasketItem(string Name, decimal UnitPrice, int Quantity);

public record PaytrTokenParams(
    string MerchantOid,
    string Email,
    int PaymentAmountKurus,
    IReadOnlyList<PaytrBasketItem> Basket,
    string UserIp,
    string UserName,
    string UserAddress,
    string UserPhone);

public record PaytrTokenResult(bool Success, string? Token, string? Error);
