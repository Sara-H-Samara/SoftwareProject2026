using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Application.DTOs.Artworks;

// ── Request DTOs ───────────────────────────────────────────────────────────────

/// <summary>
/// Used when an artist creates a new artwork.
/// The image file is uploaded separately via multipart/form-data.
/// </summary>
public record CreateArtworkRequestDto(
    string Title,
    string? Description,
    string? Dimensions,
    string? Materials,
    int? Year,
    decimal? Price,
    ArtworkType ArtworkType,
    // 3D placement — optional, defaults to center of room
    float PositionX = 0f,
    float PositionY = 1.5f,
    float PositionZ = 0f,
    float RotationX = 0f,
    float RotationY = 0f,
    float RotationZ = 0f,
    float ScaleX = 1f,
    float ScaleY = 1f,
    float ScaleZ = 1f,
    bool IsPublished = true
);

/// <summary>Partial update — all fields optional (PATCH semantics).</summary>
public record UpdateArtworkRequestDto(
    string? Title,
    string? Description,
    string? Dimensions,
    string? Materials,
    int? Year,
    decimal? Price,
    ArtworkType? ArtworkType,
    bool? IsPublished,
    float? PositionX,
    float? PositionY,
    float? PositionZ,
    float? RotationX,
    float? RotationY,
    float? RotationZ,
    float? ScaleX,
    float? ScaleY,
    float? ScaleZ
);

/// <summary>Used when saving 3D layout positions from the gallery editor.</summary>
public record UpdateArtworkPositionDto(
    Guid ArtworkId,
    float PositionX,
    float PositionY,
    float PositionZ,
    float RotationX,
    float RotationY,
    float RotationZ,
    float ScaleX,
    float ScaleY,
    float ScaleZ
);

// ── Response DTOs ──────────────────────────────────────────────────────────────

public record ArtworkDto(
    Guid Id,
    string Title,
    string? Description,
    string ImageUrl,
    string ArtistId,
    string? ArtistName,
    string? Dimensions,
    string? Materials,
    int? Year,
    decimal? Price,
    ArtworkType ArtworkType,
    bool IsPublished,
    // 3D data
    float PositionX,
    float PositionY,
    float PositionZ,
    float RotationX,
    float RotationY,
    float RotationZ,
    float ScaleX,
    float ScaleY,
    float ScaleZ,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>Lightweight DTO for gallery grid previews (avoids over-fetching).</summary>
public record ArtworkSummaryDto(
    Guid Id,
    string Title,
    string ImageUrl,
    string? ArtistName,
    ArtworkType ArtworkType,
    decimal? Price
);
