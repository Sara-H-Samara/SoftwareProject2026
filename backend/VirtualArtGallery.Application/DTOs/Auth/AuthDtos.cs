using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Application.DTOs.Auth;



public record RegisterRequestDto(
    string Email,
    string Password,
    string DisplayName,
    UserType UserType,
    string? GalleryName  
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
    string? Bio
    
);

public record ChangePasswordRequestDto(
    string CurrentPassword,
    string NewPassword
);



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
