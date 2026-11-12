namespace PersonalTrainer.Application.Common;

public static class PhoneNumber
{
    public const string InvalidMessage = "Geçerli bir GSM numarası gir (5xx xxx xx xx).";

    private static readonly string[] AllowedPrefixes = ["", "0", "90", "0090"];

    public static string? Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var digits = new string(input.Where(char.IsAsciiDigit).ToArray());
        if (digits.Length < 10)
            return null;

        var significant = digits[^10..];
        var prefix = digits[..^10];
        if (!AllowedPrefixes.Contains(prefix) || significant[0] != '5')
            return null;

        return significant;
    }
}
