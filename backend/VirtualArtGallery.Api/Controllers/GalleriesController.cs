// backend/VirtualArtGallery.Api/Controllers/GalleriesController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Application.DTOs.Galleries;
using VirtualArtGallery.Application.Services;
using Microsoft.Extensions.Logging;

namespace VirtualArtGallery.Api.Controllers;

[Route("api/galleries")]
[ApiController]
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
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GalleryListResponseDto), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var result = await _galleryService.GetAllGalleriesAsync(page, pageSize);
        return ToActionResult(result);
    }

    /// <summary>
    /// Search galleries and artworks by keyword.
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
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
    /// </summary>
    [HttpGet("{artistId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ArtistGalleryInfoDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetArtistGallery(string artistId)
    {
        try
        {
            _logger.LogInformation("Fetching gallery for artist: {ArtistId}", artistId);
            
            if (string.IsNullOrEmpty(artistId))
                return NotFound(new { error = "Artist ID is required" });
            
            var result = await _galleryService.GetArtistGalleryAsync(artistId);
            
            if (!result.IsSuccess)
                return NotFound(new { error = result.Error ?? "Gallery not found" });
            
            return Ok(result.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching gallery for artist: {ArtistId}", artistId);
            return NotFound(new { error = "Gallery not found" });
        }
    }

    /// <summary>
    /// Get all published artworks for an artist's gallery.
    /// </summary>
    [HttpGet("{artistId}/artworks")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<ArtworkDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetArtistArtworks(string artistId)
    {
        try
        {
            _logger.LogInformation("Fetching artworks for artist: {ArtistId}", artistId);
            
            if (string.IsNullOrEmpty(artistId))
                return Ok(new List<ArtworkDto>()); 
            
            var result = await _artworkService.GetPublishedArtworksForArtistAsync(artistId);
            
            if (!result.IsSuccess)
                return Ok(new List<ArtworkDto>());
            
            return Ok(result.Value ?? new List<ArtworkDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching artworks for artist: {ArtistId}", artistId);
            return Ok(new List<ArtworkDto>());
        }
    }
}