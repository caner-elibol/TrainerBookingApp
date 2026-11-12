using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using PersonalTrainer.Application.Auth;
using PersonalTrainer.Application.Common;
using PersonalTrainer.Domain.Entities;

namespace PersonalTrainer.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IOtpAuthService _otpAuthService;
    private readonly IEnumerable<IExternalAuthVerifier> _externalAuthVerifiers;

    public AuthController(
        UserManager<User> userManager,
        ITokenService tokenService,
        IRefreshTokenService refreshTokenService,
        IOtpAuthService otpAuthService,
        IEnumerable<IExternalAuthVerifier> externalAuthVerifiers)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
        _otpAuthService = otpAuthService;
        _externalAuthVerifiers = externalAuthVerifiers;
    }

    [HttpPost("otp/request")]
    public IActionResult RequestOtp(RequestOtpRequest request)
    {
        if (PhoneNumber.Normalize(request.Phone) is null)
            return BadRequest(new { error = PhoneNumber.InvalidMessage });

        return NoContent();
    }

    [HttpPost("otp/verify")]
    public async Task<ActionResult<OtpVerifyResponse>> VerifyOtp(VerifyOtpRequest request, CancellationToken ct)
    {
        var phone = PhoneNumber.Normalize(request.Phone);
        if (phone is null)
            return BadRequest(new { error = PhoneNumber.InvalidMessage });

        var result = await _otpAuthService.VerifyAsync(phone, request.Code, request.FullName, request.Role, ct);
        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        return Ok(new OtpVerifyResponse(result.RequiresRegistration, result.Auth));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var rotation = await _refreshTokenService.ValidateAndRotateAsync(request.RefreshToken, ct);
        if (rotation is null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(rotation.UserId.ToString());
        if (user is null)
            return Unauthorized();

        var access = _tokenService.GenerateAccessToken(user);
        return Ok(new AuthResponse(access.Token, access.ExpiresAtUtc, rotation.NewRawToken, rotation.NewExpiresAtUtc));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct)
    {
        await _refreshTokenService.RevokeAsync(request.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("external-login")]
    public async Task<ActionResult<AuthResponse>> ExternalLogin(ExternalLoginRequest request, CancellationToken ct)
    {
        var verifier = _externalAuthVerifiers.FirstOrDefault(v =>
            v.Provider.Equals(request.Provider, StringComparison.OrdinalIgnoreCase));
        if (verifier is null)
            return BadRequest($"Unsupported provider '{request.Provider}'.");

        ExternalAuthResult verified;
        try
        {
            verified = await verifier.VerifyAsync(request.IdToken, ct);
        }
        catch (Exception)
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByLoginAsync(verifier.Provider, verified.ProviderKey);

        if (user is null)
        {
            user = await _userManager.FindByEmailAsync(verified.Email);

            if (user is null)
            {
                user = new User
                {
                    Email = verified.Email,
                    UserName = verified.Email,
                    FullName = verified.FullName ?? verified.Email,
                    Role = request.Role,
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return ValidationProblem(BuildErrorModelState(createResult.Errors));
            }

            var addLoginResult = await _userManager.AddLoginAsync(
                user, new UserLoginInfo(verifier.Provider, verified.ProviderKey, verifier.Provider));
            if (!addLoginResult.Succeeded)
                return ValidationProblem(BuildErrorModelState(addLoginResult.Errors));
        }

        return Ok(await IssueTokensAsync(user, ct));
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var access = _tokenService.GenerateAccessToken(user);
        var refresh = await _refreshTokenService.IssueAsync(user.Id, ct);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken, refresh.ExpiresAtUtc);
    }

    private static ModelStateDictionary BuildErrorModelState(IEnumerable<IdentityError> errors)
    {
        var modelState = new ModelStateDictionary();
        foreach (var error in errors)
            modelState.AddModelError(error.Code, error.Description);
        return modelState;
    }
}
