// VirtualArtGallery.Application/DTOs/Avatars/AvatarDto.cs

namespace VirtualArtGallery.Application.DTOs.Avatars;

public record AvatarDto(
    Guid Id,
    string UserId,
    string SkinColor,
    float Height,
    string HairStyle,
    string HairColor,
    string ShirtStyle,
    string ShirtColor,
    string PantsStyle,
    string PantsColor,
    string ShoesColor,
    string Accessory,
    string AccessoryColor,
    DateTime UpdatedAt
);

/// <summary>
/// Partial update — all fields optional; only supplied values are applied.
/// </summary>
public record UpdateAvatarRequestDto(
    string? SkinColor = null,
    float? Height = null,
    string? HairStyle = null,
    string? HairColor = null,
    string? ShirtStyle = null,
    string? ShirtColor = null,
    string? PantsStyle = null,
    string? PantsColor = null,
    string? ShoesColor = null,
    string? Accessory = null,
    string? AccessoryColor = null
);