using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Application.DTOs.Auth;

// ── Request DTOs ───────────────────────────────────────────────────────────────

public record RegisterRequestDto(
    string Email,
    string Password,
    string DisplayName,
    UserType UserType,
    string? GalleryName  // Required if UserType == Artist
);

public record LoginRequestDto(
    string Email,
    string Password
);

public record RefreshTokenRequestDto(
    string AccessToken,
    string RefreshToken
);

public record ForgotPasswordRequestDto(string Email);

public record ResetPasswordRequestDto(
    string Email,
    string Token,
    string NewPassword
);

public record UpdateProfileRequestDto(
    string? DisplayName,
    string? GalleryName,
    string? Bio    // Profile picture is handled as a separate multipart/form-data upload endpoint
);

public record ChangePasswordRequestDto(
    string CurrentPassword,
    string NewPassword
);

// ── Response DTOs ──────────────────────────────────────────────────────────────

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiry,
    UserProfileDto User
);

public record UserProfileDto(
    string Id,
    string Email,
    string? DisplayName,
    UserType UserType,
    string? GalleryName,
    string? Bio,
    string? ProfilePicUrl,
    DateTime CreatedAt
);
