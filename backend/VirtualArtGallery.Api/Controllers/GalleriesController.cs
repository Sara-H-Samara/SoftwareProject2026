using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Application.DTOs.Galleries;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

/// <summary>
/// Public-facing gallery browsing endpoints. No authentication required.
///
/// GET /api/galleries                   – paginated list of all artist galleries
/// GET /api/galleries/search?q=...      – search galleries and artworks
/// GET /api/galleries/{artistId}        – single artist gallery (profile + artworks list)
/// GET /api/galleries/{artistId}/artworks – all published artworks for 3D gallery view
/// </summary>
[Route("api/galleries")]
public class GalleriesController : BaseApiController
{
    private readonly GalleryService _galleryService;
    private readonly ArtworkService _artworkService;
    private readonly ILogger<GalleriesController> _logger;

    public GalleriesController(
        GalleryService galleryService,
        ArtworkService artworkService,
        ILogger<GalleriesController> logger)
    {
        _galleryService = galleryService;
        _artworkService = artworkService;
        _logger = logger;
    }

    /// <summary>
    /// Get all public galleries with pagination.
    /// Only shows artists who have at least one published artwork.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(GalleryListResponseDto), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var result = await _galleryService.GetAllGalleriesAsync(page, pageSize);
        return ToActionResult(result);
    }

    /// <summary>Search galleries and artworks by keyword.</summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(GalleryListResponseDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { error = "Search query is required." });

        var result = await _galleryService.SearchGalleriesAsync(q, page, pageSize);
        return ToActionResult(result);
    }

    /// <summary>
    /// Get a single artist's gallery info (profile, bio, artwork count).
    /// Used to render the gallery "entrance" page before entering 3D.
    /// </summary>
    [HttpGet("{artistId}")]
    [ProducesResponseType(typeof(ArtistGalleryInfoDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetArtistGallery(string artistId)
    {
        _logger.LogInformation("[GalleriesController] Fetching gallery info for artistId: {ArtistId}", artistId);
        var result = await _galleryService.GetArtistGalleryAsync(artistId);
        
        if (!result.IsSuccess)
        {
            _logger.LogWarning("[GalleriesController] Failed to fetch gallery info for artistId {ArtistId}: {Error}", artistId, result.Error);
        }
        
        return ToActionResult(result);
    }

    /// <summary>
    /// Get all published artworks for an artist's gallery — this is the payload
    /// loaded into the Three.js scene to position and render each artwork mesh.
    /// Includes full 3D placement data (position, rotation, scale).
    /// </summary>
    [HttpGet("{artistId}/artworks")]
    [ProducesResponseType(typeof(List<ArtworkDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetArtistArtworks(string artistId)
    {
        _logger.LogInformation("[GalleriesController] Fetching published artworks for artistId: {ArtistId}", artistId);
        var result = await _artworkService.GetPublishedArtworksForArtistAsync(artistId);
        
        if (result.IsSuccess)
        {
            _logger.LogInformation("[GalleriesController] Found {Count} published artworks for artistId: {ArtistId}", result.Value?.Count ?? 0, artistId);
        }
        else
        {
            _logger.LogWarning("[GalleriesController] Failed to fetch artworks for artistId {ArtistId}: {Error}", artistId, result.Error);
        }

        return ToActionResult(result);
    }
}
