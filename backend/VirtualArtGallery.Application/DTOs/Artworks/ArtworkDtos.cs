using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Application.DTOs.Artworks;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record CreateArtworkRequestDto(
    string Title,
    string? Description,
    string? Dimensions,
    string? Materials,
    int? Year,
    decimal? Price,
    ArtworkType ArtworkType,
    string? AudioUrl,
    float PositionX = 0f,
    float PositionY = 1.5f,
    float PositionZ = 0f,
    float RotationX = 0f,
    float RotationY = 0f,
    float RotationZ = 0f,
    float ScaleX = 1f,
    float ScaleY = 1f,
    float ScaleZ = 1f
);

public record UpdateArtworkRequestDto(
    string? Title,
    string? Description,
    string? Dimensions,
    string? Materials,
    int? Year,
    decimal? Price,
    string? AudioUrl,
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

// ── Response DTOs ─────────────────────────────────────────────────────────────

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
    string? AudioUrl,
    bool IsPublished,
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
    DateTime UpdatedAt,
    // ── Visual analysis fields (null if not yet analyzed) ─────────────────────
    string? ColorMood,
    string? VisualStyle,
    string? Subject,
    string? Mood,
    string? DominantColors,
    bool IsVisuallyAnalyzed
);

public record ArtworkSummaryDto(
    Guid Id,
    string Title,
    string ImageUrl,
    string? ArtistName,
    ArtworkType ArtworkType,
    decimal? Price
);

public class SearchResultDto<T>
{
    public List<T> Items      { get; set; } = new();
    public int TotalCount     { get; set; }
    public int Page           { get; set; }
    public int PageSize       { get; set; }
    public bool HasNextPage   { get; set; }
    public bool HasPrevPage   { get; set; }
}