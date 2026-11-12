using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Data;

namespace PersonalTrainer.Infrastructure.Trainers;

public class LocationService : ILocationService
{
    private readonly AppDbContext _db;

    public LocationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TrainerLocationDto>> GetLocationsAsync(Guid trainerId, CancellationToken ct = default) =>
        await _db.TrainerLocations.AsNoTracking()
            .Where(l => l.TrainerId == trainerId)
            .OrderBy(l => l.SortOrder).ThenBy(l => l.Name)
            .Select(l => new TrainerLocationDto(l.Id, l.Name, l.SortOrder))
            .ToListAsync(ct);

    public async Task<TrainerLocationDto> CreateLocationAsync(Guid trainerId, string name, CancellationToken ct = default)
    {
        var maxSortOrder = await _db.TrainerLocations
            .Where(l => l.TrainerId == trainerId)
            .Select(l => (int?)l.SortOrder)
            .MaxAsync(ct) ?? -1;

        var location = new TrainerLocation
        {
            TrainerId = trainerId,
            Name = name.Trim(),
            SortOrder = maxSortOrder + 1,
        };

        _db.TrainerLocations.Add(location);
        await _db.SaveChangesAsync(ct);

        return new TrainerLocationDto(location.Id, location.Name, location.SortOrder);
    }

    public async Task<DeleteLocationResult> DeleteLocationAsync(Guid trainerId, Guid locationId, CancellationToken ct = default)
    {
        var location = await _db.TrainerLocations
            .FirstOrDefaultAsync(l => l.Id == locationId && l.TrainerId == trainerId, ct);
        if (location is null)
            return new DeleteLocationResult(false, "Location not found.");

        var locationCount = await _db.TrainerLocations.CountAsync(l => l.TrainerId == trainerId, ct);
        if (locationCount <= 1)
            return new DeleteLocationResult(false, "En az bir konum olmalı. Önce yeni bir konum ekle, sonra bunu sil.");

        var travelTimes = await _db.LocationTravelTimes
            .Where(t => t.TrainerId == trainerId && (t.LocationAId == locationId || t.LocationBId == locationId))
            .ToListAsync(ct);
        _db.LocationTravelTimes.RemoveRange(travelTimes);
        _db.TrainerLocations.Remove(location);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return new DeleteLocationResult(false, "Bu konuma bağlı randevular olduğu için silinemiyor.");
        }

        return new DeleteLocationResult(true, null);
    }

    public async Task<IReadOnlyList<LocationTravelTimeDto>> GetTravelTimesAsync(Guid trainerId, CancellationToken ct = default) =>
        await _db.LocationTravelTimes.AsNoTracking()
            .Where(t => t.TrainerId == trainerId)
            .Select(t => new LocationTravelTimeDto(t.LocationAId, t.LocationBId, t.Minutes))
            .ToListAsync(ct);

    public async Task<SetTravelTimeResult> SetTravelTimeAsync(
        Guid trainerId, Guid locationId, Guid otherLocationId, int minutes, CancellationToken ct = default)
    {
        if (locationId == otherLocationId)
            return new SetTravelTimeResult(false, "A location's travel time to itself cannot be set.", null);

        if (minutes < 0)
            return new SetTravelTimeResult(false, "Travel time cannot be negative.", null);

        var matchingLocationCount = await _db.TrainerLocations
            .CountAsync(l => l.TrainerId == trainerId && (l.Id == locationId || l.Id == otherLocationId), ct);
        if (matchingLocationCount != 2)
            return new SetTravelTimeResult(false, "Location not found.", null);

        var (a, b) = locationId.CompareTo(otherLocationId) < 0 ? (locationId, otherLocationId) : (otherLocationId, locationId);

        var existing = await _db.LocationTravelTimes
            .FirstOrDefaultAsync(t => t.TrainerId == trainerId && t.LocationAId == a && t.LocationBId == b, ct);

        if (existing is null)
        {
            existing = new LocationTravelTime { TrainerId = trainerId, LocationAId = a, LocationBId = b, Minutes = minutes };
            _db.LocationTravelTimes.Add(existing);
        }
        else
        {
            existing.Minutes = minutes;
        }

        await _db.SaveChangesAsync(ct);

        return new SetTravelTimeResult(true, null, new LocationTravelTimeDto(a, b, minutes));
    }
}
