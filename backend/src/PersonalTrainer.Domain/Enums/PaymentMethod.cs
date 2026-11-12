using System.Text.Json.Serialization;

namespace PersonalTrainer.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentMethod
{
    Cash = 1,        // Nakit/Elden
    BankTransfer = 2 // IBAN
}
