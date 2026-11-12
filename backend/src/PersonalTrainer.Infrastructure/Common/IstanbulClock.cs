namespace PersonalTrainer.Infrastructure.Common;

public static class IstanbulClock
{
    public static readonly TimeZoneInfo TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");

    public static DateTime ConvertLocalToUtc(DateTime local) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), TimeZone);

    public static DateTime ConvertUtcToLocal(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), TimeZone);

    public static DateOnly TodayIstanbul() => DateOnly.FromDateTime(ConvertUtcToLocal(DateTime.UtcNow));
}
