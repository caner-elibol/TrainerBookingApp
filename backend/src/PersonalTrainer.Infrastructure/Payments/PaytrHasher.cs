using System.Security.Cryptography;
using System.Text;

namespace PersonalTrainer.Infrastructure.Payments;

internal static class PaytrHasher
{
    public static string ComputeHmacSha256Base64(string input, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(input)));
    }
}
