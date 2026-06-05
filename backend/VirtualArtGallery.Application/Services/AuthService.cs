using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Auth;
using VirtualArtGallery.Core.Constants;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Enums;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class AuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;
    private readonly ICloudStorageService _storageService;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _db;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IOptions<JwtSettings> jwtSettings,
        IEmailService emailService,
        ICloudStorageService storageService,
        IConfiguration configuration,
        ApplicationDbContext db)
    {
        _userManager   = userManager;
        _signInManager = signInManager;
        _jwtSettings   = jwtSettings.Value;
        _emailService  = emailService;
        _storageService = storageService;
        _configuration = configuration;
        _db            = db;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            return Result<AuthResponseDto>.Failure("An account with this email already exists.");

        var user = new ApplicationUser
        {
            UserName      = dto.Email,
            Email         = dto.Email,
            DisplayName   = dto.DisplayName,
            UserType      = dto.UserType,
            GalleryName   = dto.UserType == UserType.Artist
                                ? (dto.GalleryName ?? AppConstants.Defaults.GalleryName)
                                : null,
            ProfilePicUrl = AppConstants.Defaults.ProfilePicUrl,
            CreatedAt     = DateTime.UtcNow,
        };

        var createResult = await _userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result<AuthResponseDto>.Failure(errors);
        }

        var role = dto.UserType == UserType.Artist ? "Artist" : "Visitor";
        await _userManager.AddToRoleAsync(user, role);

        var authResponse = await GenerateAuthResponseAsync(user);
        return Result<AuthResponseDto>.Success(authResponse);
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return Result<AuthResponseDto>.Failure("Invalid email or password.", 401);

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return Result<AuthResponseDto>.Failure("Account locked due to too many failed attempts. Try again in 5 minutes.", 403);

        if (!result.Succeeded)
            return Result<AuthResponseDto>.Failure("Invalid email or password.", 401);

        var authResponse = await GenerateAuthResponseAsync(user);
        return Result<AuthResponseDto>.Success(authResponse);
    }

    public async Task<Result<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto)
    {
        var principal = GetPrincipalFromExpiredToken(dto.AccessToken);
        if (principal == null)
            return Result<AuthResponseDto>.Failure("Invalid access token.", 401);

        var userId = principal.FindFirstValue(AppConstants.JwtClaims.UserId);
        var user   = await _userManager.FindByIdAsync(userId ?? string.Empty);

        if (user == null
            || user.RefreshToken != dto.RefreshToken
            || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return Result<AuthResponseDto>.Failure("Invalid or expired refresh token.", 401);
        }

        var authResponse = await GenerateAuthResponseAsync(user);
        return Result<AuthResponseDto>.Success(authResponse);
    }

    public async Task<Result<UserProfileDto>> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Result<UserProfileDto>.NotFound("User not found.");
        return Result<UserProfileDto>.Success(MapToProfileDto(user));
    }

    public async Task<Result<UserProfileDto>> UpdateProfileAsync(string userId, UpdateProfileRequestDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Result<UserProfileDto>.NotFound("User not found.");

        if (dto.DisplayName != null) user.DisplayName = dto.DisplayName;
        if (dto.GalleryName != null) user.GalleryName = dto.GalleryName;
        if (dto.Bio         != null) user.Bio         = dto.Bio;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return Result<UserProfileDto>.Failure(string.Join("; ", result.Errors.Select(e => e.Description)));

        return Result<UserProfileDto>.Success(MapToProfileDto(user));
    }

    public async Task<Result<UserProfileDto>> UpdateProfilePictureAsync(
        string userId, Stream imageStream, string fileName, string contentType)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Result<UserProfileDto>.NotFound("User not found.");

        var isDefaultImage = string.IsNullOrEmpty(user.ProfilePicUrl)
            || user.ProfilePicUrl.Contains("default-avatar")
            || user.ProfilePicUrl == AppConstants.Defaults.ProfilePicUrl
            || user.ProfilePicUrl == "/default-avatar.png";

        if (!isDefaultImage)
        {
            try { await _storageService.DeleteFileAsync(user.ProfilePicUrl, AppConstants.BlobContainers.ProfilePictures); }
            catch (Exception ex) { Console.WriteLine($"Warning: Failed to delete old profile picture: {ex.Message}"); }
        }

        var newUrl = await _storageService.UploadFileAsync(
            imageStream, fileName, contentType, AppConstants.BlobContainers.ProfilePictures);

        user.ProfilePicUrl = newUrl;
        await _userManager.UpdateAsync(user);

        return Result<UserProfileDto>.Success(MapToProfileDto(user));
    }

    public async Task<Result> ForgotPasswordAsync(ForgotPasswordRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Result.Success();

        var token        = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
        var resetLink   = $"{frontendUrl}/reset-password?email={user.Email}&token={encodedToken}";

        await _emailService.SendPasswordResetAsync(user.Email!, user.DisplayName ?? user.Email!, resetLink);
        return Result.Success();
    }

    public async Task<Result> ResetPasswordAsync(ResetPasswordRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Result.Failure("Invalid request.", 400);

        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        var result       = await _userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);

        if (!result.Succeeded)
            return Result.Failure(string.Join("; ", result.Errors.Select(e => e.Description)));

        user.RefreshToken           = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        return Result.Success();
    }

    public async Task<Result> DeleteAccountAsync(string userId)
{
    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
        return Result.NotFound("User not found.");

    // 1. Activities
    _db.Activities.RemoveRange(_db.Activities.Where(a => a.ActorId == userId));
    // 2. Notifications
    _db.Notifications.RemoveRange(_db.Notifications.Where(n => n.UserId == userId));
    // 3. Follows
    _db.Follows.RemoveRange(_db.Follows.Where(f => f.FollowerId == userId || f.FollowedId == userId));
    // 4. Likes
    _db.Likes.RemoveRange(_db.Likes.Where(l => l.UserId == userId));
    // 5. Reviews
    _db.Reviews.RemoveRange(_db.Reviews.Where(r => r.UserId == userId));
    // 6. CollectionItems (لكل لوحات الفنان)
    var artworkIds = _db.Artworks.Where(a => a.ArtistId == userId).Select(a => a.Id);
    _db.CollectionItems.RemoveRange(_db.CollectionItems.Where(ci => artworkIds.Contains(ci.ArtworkId)));
    var collections = _db.Collections.Where(c => c.UserId == userId);
    _db.Collections.RemoveRange(collections);
    // 8. Artworks
    _db.Artworks.RemoveRange(_db.Artworks.Where(a => a.ArtistId == userId));
    // 9. UserBadges
    _db.UserBadges.RemoveRange(_db.UserBadges.Where(b => b.UserId == userId));

    await _db.SaveChangesAsync();

    var result = await _userManager.DeleteAsync(user);
    if (!result.Succeeded)
        return Result.Failure("Failed to delete account.");

    return Result.Success();
}
    private async Task<AuthResponseDto> GenerateAuthResponseAsync(ApplicationUser user)
    {
        var accessToken  = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        var expiry       = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);

        user.RefreshToken           = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);
        await _userManager.UpdateAsync(user);

        return new AuthResponseDto(
            AccessToken:       accessToken,
            RefreshToken:      refreshToken,
            AccessTokenExpiry: expiry,
            User:              MapToProfileDto(user)
        );
    }

    private string GenerateAccessToken(ApplicationUser user)
    {
        var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(AppConstants.JwtClaims.UserId,    user.Id),
            new Claim(ClaimTypes.Email,                 user.Email!),
            new Claim(AppConstants.JwtClaims.UserType,  user.UserType.ToString()),
            new Claim(ClaimTypes.Role,                  user.UserType.ToString()),
            new Claim(AppConstants.JwtClaims.GalleryName, user.GalleryName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti,      Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:            _jwtSettings.Issuer,
            audience:          _jwtSettings.Audience,
            claims:            claims,
            expires:           DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = _jwtSettings.Issuer,
            ValidAudience            = _jwtSettings.Audience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret)),
            ValidateLifetime         = false
        };

        try
        {
            var handler   = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, validationParams, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtToken
                || !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
                return null;

            return principal;
        }
        catch { return null; }
    }

    private static UserProfileDto MapToProfileDto(ApplicationUser user) => new(
        Id:            user.Id,
        Email:         user.Email!,
        DisplayName:   user.DisplayName,
        UserType:      user.UserType,
        GalleryName:   user.GalleryName,
        Bio:           user.Bio,
        ProfilePicUrl: user.ProfilePicUrl,
        CreatedAt:     user.CreatedAt
    );
}