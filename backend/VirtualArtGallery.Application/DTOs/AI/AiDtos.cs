// VirtualArtGallery.Application/DTOs/AI/AiDtos.cs

using System.Collections.Generic;

namespace VirtualArtGallery.Application.DTOs.AI;

// ── Description ───────────────────────────────────────────────────────────────

public record DescriptionPromptDto(
    string Title, string ArtworkType, string? Materials, string? AdditionalContext);

public record SuggestedDescriptionDto(string Description);

// ── Inspiration ───────────────────────────────────────────────────────────────

public record InspirationPromptDto(
    string? ArtistBio, string? PreferredStyle, int NumberOfIdeas = 3);

public record InspirationResultDto(string Ideas);

// ── Arrangement ───────────────────────────────────────────────────────────────

public record ArtworkArrangementRequestDto(
    List<ArtworkForAnalysisDto> Artworks,
    GalleryLayoutInfoDto        GalleryLayout);

/// <summary>
/// Artwork data for AI analysis — includes visual properties
/// populated by AnalyzeArtworkImageAsync after upload.
/// </summary>
public record ArtworkForAnalysisDto(
    string   Id,
    string   Title,
    string   ArtworkType,
    string?  Description,
    string?  Materials,
    string?  Dimensions,
    int?     Year,
    decimal? Price,
    List<string>? ColorPalette,
    List<string>? Tags,
    // ── Visual analysis fields (null if not yet analyzed) ─────────────────────
    string?  ColorMood,
    string?  VisualStyle,
    string?  Subject,
    string?  Mood,
    string?  DominantColors,
    bool     IsVisuallyAnalyzed = false);

public record GalleryLayoutInfoDto(
    double RoomWidth, double RoomDepth, double WallHeight,
    string Shape, int TotalWallPositions,
    List<WallSegmentDto> WallSegments);

public record WallSegmentDto(
    string WallId, string Label, int PositionCount,
    double StartX, double StartZ, double EndX, double EndZ);

public record ArtworkArrangementResultDto(
    List<ArtworkPlacementDto> Placements,
    string                    Explanation);

public record ArtworkPlacementDto(
    string ArtworkId, double PositionX, double PositionY, double PositionZ,
    double RotationY, string WallId, string PlacementReason);

// ── Title Suggestion ──────────────────────────────────────────────────────────

public record SuggestTitleRequestDto(
    string? Description, string? ArtworkType, string? Materials, string? AdditionalContext , string? ImageUrl = null );

public record SuggestTitleResponseDto(List<string> Suggestions);


// ── Full Image Analysis  ─────────────────────────────────────
public record AnalyzeImageRequestDto(
    string  ImageUrl,
    string? ArtworkType = null);
 
public record AnalyzeImageResponseDto(
    string        SuggestedTitle,
    string        SuggestedDescription,
    string?       SuggestedMaterials,
    string?       SuggestedArtworkType,
    decimal?      SuggestedPrice,
    string?       ColorMood,
    string?       VisualStyle,
    string?       Subject,
    string?       Mood,
    List<string>  TitleAlternatives);
 