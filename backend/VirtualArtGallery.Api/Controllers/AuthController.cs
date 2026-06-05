using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Auth;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

/// <summary>
/// Handles all authentication and user account endpoints.
///
/// Public endpoints (no auth required):
///   POST /api/auth/register
///   POST /api/auth/login
///   POST /api/auth/refresh-token
///   POST /api/auth/forgot-password
///   POST /api/auth/reset-password
///
/// Authenticated endpoints:
///   GET    /api/auth/profile
///   PUT    /api/auth/profile
///   POST   /api/auth/profile/picture
///   POST   /api/auth/change-password
/// </summary>
[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    // ── Public Endpoints ───────────────────────────────────────────────────────

    /// <summary>Register a new artist or visitor account.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return ToActionResult(result);
    }

    /// <summary>Authenticate and receive JWT + refresh token.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return ToActionResult(result);
    }

    /// <summary>Exchange an expired JWT + valid refresh token for a new token pair.</summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto);
        return ToActionResult(result);
    }

    /// <summary>Sends a password reset email. Always returns 200 to prevent email enumeration.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
        await _authService.ForgotPasswordAsync(dto);
        return Ok(new { message = "If an account with that email exists, a reset link has been sent." });
    }

    /// <summary>Completes the password reset using the emailed token.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
    {
        var result = await _authService.ResetPasswordAsync(dto);
        return ToActionResult(result);
    }

    // ── Authenticated Endpoints ────────────────────────────────────────────────

    /// <summary>Get the current user's profile.</summary>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), 200)]
    public async Task<IActionResult> GetProfile()
    {
        var userId = RequireCurrentUserId();
        var result = await _authService.GetProfileAsync(userId);
        return ToActionResult(result);
    }

    /// <summary>Update display name, gallery name, and bio.</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _authService.UpdateProfileAsync(userId, dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// Upload a new profile picture.
    /// Accepts multipart/form-data with a single file field named "file".
    /// </summary>
    [HttpPost("profile/picture")]
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    [ProducesResponseType(typeof(UserProfileDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateProfilePicture(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var userId = RequireCurrentUserId();

        await using var stream = file.OpenReadStream();
        var result = await _authService.UpdateProfilePictureAsync(
            userId, stream, file.FileName, file.ContentType);

        return ToActionResult(result);
    }

    /// <summary>Permanently delete the current user's account.</summary>
    [HttpDelete("account")]
    [Authorize]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = RequireCurrentUserId();
        var result = await _authService.DeleteAccountAsync(userId);
        return ToActionResult(result);
    }
}
