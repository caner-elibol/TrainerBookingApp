namespace PersonalTrainer.Application.Account;

public interface IAccountService
{
    Task<AccountProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default);

    Task<AccountProfileDto?> UpdateProfileAsync(Guid userId, UpdateAccountProfileRequest request, CancellationToken ct = default);

    Task<AccountActionResult> SetInitialWeightAsync(Guid userId, decimal weightKg, CancellationToken ct = default);

    Task<AccountActionResult> RequestEmailActivationAsync(Guid userId, string email, CancellationToken ct = default);

    Task<AccountActionResult> ConfirmEmailActivationAsync(Guid userId, string code, CancellationToken ct = default);
}
