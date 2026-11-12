namespace PersonalTrainer.Application.Packages;

public interface IPackageService
{
    Task<PackageDto> CreateAsync(Guid trainerId, CreatePackageRequest request, CancellationToken ct = default);

    Task<PackageDto?> UpdateAsync(Guid trainerId, Guid packageId, UpdatePackageRequest request, CancellationToken ct = default);

    Task<bool> DeactivateAsync(Guid trainerId, Guid packageId, CancellationToken ct = default);

    Task<IReadOnlyList<PackageDto>> GetMineAsync(Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<PackageDto>> GetActiveForTrainerAsync(Guid trainerId, CancellationToken ct = default);

    Task<IReadOnlyList<PackageInsightDto>> GetMyInsightsAsync(Guid trainerId, CancellationToken ct = default);
}
