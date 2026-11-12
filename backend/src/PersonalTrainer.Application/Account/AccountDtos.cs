namespace PersonalTrainer.Application.Account;

public record AccountProfileDto(string FullName, string Email, string? Phone, string? City, DateOnly? DateOfBirth, decimal? HeightCm, bool EmailConfirmed);

public record UpdateAccountProfileRequest(string? Phone, string? City, DateOnly? DateOfBirth, decimal? HeightCm);

public record SetInitialWeightRequest(decimal WeightKg);

public record RequestEmailActivationRequest(string Email);

public record ConfirmEmailActivationRequest(string Code);

public record AccountActionResult(bool Success, string? Error);
