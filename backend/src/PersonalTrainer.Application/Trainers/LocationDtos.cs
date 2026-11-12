namespace PersonalTrainer.Application.Trainers;

public record TrainerLocationDto(Guid Id, string Name, int SortOrder);

public record CreateLocationRequest(string Name);

public record LocationTravelTimeDto(Guid LocationAId, Guid LocationBId, int Minutes);

public record SetTravelTimeRequest(Guid OtherLocationId, int Minutes);

public record DeleteLocationResult(bool Success, string? Error);

public record SetTravelTimeResult(bool Success, string? Error, LocationTravelTimeDto? TravelTime);
