using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Galleries;
using VirtualArtGallery.Core.Constants;
using VirtualArtGallery.Core.Enums;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

/// <summary>
/// Handles public-facing gallery browsing. All queries here only return
/// published artworks from verified Artist accounts.
/// No authentication required for read operations in this service.
/// </summary>
public class GalleryService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<GalleryService> _logger;

    public GalleryService(ApplicationDbContext db, ILogger<GalleryService> logger)
    {
        _db = db;
        _logger = logger;

    }

    // ── Browse All Galleries ───────────────────────────────────────────────────

    /// <summary>
    /// Returns a paginated list of all artist galleries that have at least one published artwork.
    /// Used on the Browse Galleries discovery page.
    /// </summary>
    public async Task<Result<GalleryListResponseDto>> GetAllGalleriesAsync(int page = 1, int pageSize = 12)
    {
        pageSize = Math.Clamp(pageSize, 1, AppConstants.Pagination.MaxPageSize);
        page = Math.Max(1, page);

        var artistsWithArtQuery = _db.Users
            .Where(u => u.UserType == UserType.Artist && u.Artworks.Any(a => a.IsPublished))
            .OrderBy(u => u.GalleryName);

        var totalCount = await artistsWithArtQuery.CountAsync();

        var artists = await artistsWithArtQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.DisplayName,
                u.GalleryName,
                u.Bio,
                u.ProfilePicUrl,
                ArtworkCount = u.Artworks.Count(a => a.IsPublished),
                FeaturedArtworks = u.Artworks
                    .Where(a => a.IsPublished)
                    .OrderBy(a => a.CreatedAt)
                    .Take(3)
                    .Select(a => new ArtworkPreviewDto(a.Id, a.Title, a.ImageUrl))
                    .ToList()
            })
            .ToListAsync();

        var galleryDtos = artists.Select(a => new ArtistGalleryInfoDto(
            ArtistId: a.Id,
            DisplayName: a.DisplayName,
            GalleryName: a.GalleryName,
            Bio: a.Bio,
            ProfilePicUrl: a.ProfilePicUrl,
            ArtworkCount: a.ArtworkCount,
            FeaturedArtworks: a.FeaturedArtworks
        )).ToList();

        return Result<GalleryListResponseDto>.Success(new GalleryListResponseDto(
            Galleries: galleryDtos,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize
        ));
    }

    // ── Single Artist Gallery ──────────────────────────────────────────────────


/// <summary>
/// Returns profile info for a specific artist's gallery.
/// </summary>
public async Task<Result<ArtistGalleryInfoDto>> GetArtistGalleryAsync(string artistId)
{
    try
    {
        var artist = await _db.Users
            .Include(u => u.Artworks.Where(a => a.IsPublished))
            .FirstOrDefaultAsync(u => u.Id == artistId && u.UserType == UserType.Artist);

        if (artist == null)
            return Result<ArtistGalleryInfoDto>.NotFound("Artist gallery not found.");

        var previews = artist.Artworks
            .OrderBy(a => a.CreatedAt)
            .Take(3)
            .Select(a => new ArtworkPreviewDto(a.Id, a.Title, a.ImageUrl))
            .ToList();

        var dto = new ArtistGalleryInfoDto(
            ArtistId: artist.Id,
            DisplayName: artist.DisplayName,
            GalleryName: artist.GalleryName,
            Bio: artist.Bio,
            ProfilePicUrl: artist.ProfilePicUrl,
            ArtworkCount: artist.Artworks.Count,
            FeaturedArtworks: previews
        );

        return Result<ArtistGalleryInfoDto>.Success(dto);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in GetArtistGalleryAsync for {ArtistId}", artistId);
        return Result<ArtistGalleryInfoDto>.NotFound("Artist gallery not found.");
    }
}

    // ── Search ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Searches galleries and artworks by keyword.
    /// Matches against gallery name, artist display name, artwork title, and description.
    /// </summary>
    public async Task<Result<GalleryListResponseDto>> SearchGalleriesAsync(
        string query, int page = 1, int pageSize = 12)
    {
        pageSize = Math.Clamp(pageSize, 1, AppConstants.Pagination.MaxPageSize);
        var lowerQuery = query.ToLower();

        var artistsQuery = _db.Users
            .Where(u => u.UserType == UserType.Artist
                && u.Artworks.Any(a => a.IsPublished)
                && (
                    (u.GalleryName != null && u.GalleryName.ToLower().Contains(lowerQuery)) ||
                    (u.DisplayName != null && u.DisplayName.ToLower().Contains(lowerQuery)) ||
                    u.Artworks.Any(a => a.IsPublished &&
                        (a.Title.ToLower().Contains(lowerQuery) ||
                         (a.Description != null && a.Description.ToLower().Contains(lowerQuery))))
                ))
            .OrderBy(u => u.GalleryName);

        var totalCount = await artistsQuery.CountAsync();

        var artists = await artistsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.DisplayName,
                u.GalleryName,
                u.Bio,
                u.ProfilePicUrl,
                ArtworkCount = u.Artworks.Count(a => a.IsPublished),
                FeaturedArtworks = u.Artworks
                    .Where(a => a.IsPublished)
                    .OrderBy(a => a.CreatedAt)
                    .Take(3)
                    .Select(a => new ArtworkPreviewDto(a.Id, a.Title, a.ImageUrl))
                    .ToList()
            })
            .ToListAsync();

        var galleryDtos = artists.Select(a => new ArtistGalleryInfoDto(
            ArtistId: a.Id,
            DisplayName: a.DisplayName,
            GalleryName: a.GalleryName,
            Bio: a.Bio,
            ProfilePicUrl: a.ProfilePicUrl,
            ArtworkCount: a.ArtworkCount,
            FeaturedArtworks: a.FeaturedArtworks
        )).ToList();

        return Result<GalleryListResponseDto>.Success(new GalleryListResponseDto(
            Galleries: galleryDtos,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize
        ));
    }
}