namespace PersonalTrainer.Application.Packages;

public record PackageDto(
    Guid Id,
    Guid TrainerId,
    string Title,
    string Description,
    int SessionCount,
    decimal Price,
    bool IsActive);

public record CreatePackageRequest(string Title, string Description, int SessionCount, decimal Price);

public record UpdatePackageRequest(string Title, string Description, int SessionCount, decimal Price);

public record PackageInsightDto(Guid PackageId, int SalesCount, int PopularityPercent);
