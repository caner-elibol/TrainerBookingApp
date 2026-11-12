namespace PersonalTrainer.Application.Reports;

public record ReportsSummaryDto(decimal MonthlyRevenue, int ActiveClients, int CompletedSessions, double CancellationRatePercent);

public record MonthlyPointDto(int Year, int Month, decimal Value);

public record WeeklySessionCountDto(int DayOfWeek, int Count);

public record ServiceMixDto(string PackageTitle, int Count);

public record TopPackageDto(string Title, decimal Revenue, int Sales);

public record HeatmapCellDto(int DayOfWeek, int Hour, int Count);

public record TrainerReportsResponse(
    ReportsSummaryDto Summary,
    IReadOnlyList<MonthlyPointDto> RevenueTrend,
    IReadOnlyList<MonthlyPointDto> ClientGrowth,
    IReadOnlyList<WeeklySessionCountDto> WeeklySessions,
    IReadOnlyList<ServiceMixDto> ServiceMix,
    IReadOnlyList<TopPackageDto> TopPackages,
    IReadOnlyList<HeatmapCellDto> BusiestHours);
