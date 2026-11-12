using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Packages;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Packages;

public class PackageService : IPackageService
{
    private readonly AppDbContext _db;

    public PackageService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PackageDto> CreateAsync(Guid trainerId, CreatePackageRequest request, CancellationToken ct = default)
    {
        var package = new Package
        {
            TrainerId = trainerId,
            Title = request.Title,
            Description = request.Description,
            SessionCount = request.SessionCount,
            Price = request.Price,
            IsActive = true,
        };

        _db.Packages.Add(package);
        await _db.SaveChangesAsync(ct);

        return ToDto(package);
    }

    public async Task<PackageDto?> UpdateAsync(Guid trainerId, Guid packageId, UpdatePackageRequest request, CancellationToken ct = default)
    {
        var package = await _db.Packages.FirstOrDefaultAsync(p => p.Id == packageId && p.TrainerId == trainerId, ct);
        if (package is null)
            return null;

        package.Title = request.Title;
        package.Description = request.Description;
        package.SessionCount = request.SessionCount;
        package.Price = request.Price;

        await _db.SaveChangesAsync(ct);
        return ToDto(package);
    }

    public async Task<bool> DeactivateAsync(Guid trainerId, Guid packageId, CancellationToken ct = default)
    {
        var package = await _db.Packages.FirstOrDefaultAsync(p => p.Id == packageId && p.TrainerId == trainerId, ct);
        if (package is null)
            return false;

        package.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<PackageDto>> GetMineAsync(Guid trainerId, CancellationToken ct = default)
    {
        return await _db.Packages.AsNoTracking()
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToDto(p))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<PackageDto>> GetActiveForTrainerAsync(Guid trainerId, CancellationToken ct = default)
    {
        return await _db.Packages.AsNoTracking()
            .Where(p => p.TrainerId == trainerId && p.IsActive)
            .OrderBy(p => p.Price)
            .Select(p => ToDto(p))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<PackageInsightDto>> GetMyInsightsAsync(Guid trainerId, CancellationToken ct = default)
    {
        var packageIds = await _db.Packages.AsNoTracking()
            .Where(p => p.TrainerId == trainerId)
            .Select(p => p.Id)
            .ToListAsync(ct);

        var salesCounts = await _db.UserPackages.AsNoTracking()
            .Where(up => packageIds.Contains(up.PackageId))
            .GroupBy(up => up.PackageId)
            .Select(g => new { PackageId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PackageId, x => x.Count, ct);

        var maxSales = salesCounts.Count > 0 ? salesCounts.Values.Max() : 0;

        return packageIds
            .Select(id =>
            {
                var sales = salesCounts.GetValueOrDefault(id, 0);
                var popularity = maxSales > 0 ? (int)Math.Round(sales * 100.0 / maxSales) : 0;
                return new PackageInsightDto(id, sales, popularity);
            })
            .ToList();
    }

    private static PackageDto ToDto(Package p) =>
        new(p.Id, p.TrainerId, p.Title, p.Description, p.SessionCount, p.Price, p.IsActive);
}
