using PersonalTrainer.Domain.Entities;

namespace PersonalTrainer.Application.Auth;

public record AccessTokenResult(string Token, DateTime ExpiresAtUtc);

public interface ITokenService
{
    AccessTokenResult GenerateAccessToken(User user);
}
