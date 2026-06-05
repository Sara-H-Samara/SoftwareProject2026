namespace VirtualArtGallery.Application.DTOs.Galleries;

/// <summary>
/// Public-facing info about an artist's gallery page.
/// Returned when a visitor browses the gallery directory.
/// </summary>
public record ArtistGalleryInfoDto(
    string ArtistId,
    string? DisplayName,
    string? GalleryName,
    string? Bio,
    string? ProfilePicUrl,
    int ArtworkCount,
    List<ArtworkPreviewDto> FeaturedArtworks  // First 3 published artworks for the card preview
);

/// <summary>Tiny preview card for use inside ArtistGalleryInfoDto.</summary>
public record ArtworkPreviewDto(
    Guid Id,
    string Title,
    string ImageUrl
);

/// <summary>Paginated list of galleries for the Browse page.</summary>
public record GalleryListResponseDto(
    List<ArtistGalleryInfoDto> Galleries,
    int TotalCount,
    int Page,
    int PageSize
);
