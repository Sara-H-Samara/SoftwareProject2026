using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Application.DTOs;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

/// <summary>
/// Artwork CRUD + image upload endpoints.
/// </summary>
[Route("api/artworks")]
public class ArtworksController : BaseApiController
{
    private readonly ArtworkService _artworkService;

    public ArtworksController(ArtworkService artworkService)
    {
        _artworkService = artworkService;
    }

    // ── Public ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Get a single artwork by ID.
    /// Returns 403 if the artwork is unpublished and the requester is not the owner.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var requestingUserId = GetCurrentUserId();
        var result = await _artworkService.GetByIdAsync(id, requestingUserId);
        return ToActionResult(result);
    }

    /// <summary>
    /// Search published artworks with filtering and sorting.
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SearchResultDto<ArtworkDto>), 200)]
    public async Task<IActionResult> Search(
        [FromQuery] string? query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? artworkType = null,
        [FromQuery] string? sortBy = null)
    {
        var result = await _artworkService.SearchArtworksAsync(
            query,
            page,
            pageSize,
            minPrice,
            maxPrice,
            artworkType,
            sortBy);

        return ToActionResult(result);
    }

    // ── Artist-Only ─────────────────────────────────────────────────────────────

    /// <summary>
    /// List all artworks owned by the authenticated artist.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(List<ArtworkDto>), 200)]
    public async Task<IActionResult> GetMyArtworks()
    {
        var artistId = RequireCurrentUserId();
        var result = await _artworkService.GetMyArtworksAsync(artistId);
        return ToActionResult(result);
    }

    /// <summary>
/// Get analytics summary for the authenticated artist.
/// </summary>
[HttpGet("analytics/summary")]
[Authorize(Roles = "Artist")]
[ProducesResponseType(typeof(AnalyticsSummaryDto), 200)]
public async Task<IActionResult> GetAnalyticsSummary()
{
    var artistId = RequireCurrentUserId();
    var result = await _artworkService.GetAnalyticsSummaryAsync(artistId);
    return ToActionResult(result);
}

    /// <summary>
    /// Create a new artwork.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Artist")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ArtworkDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create(
        [FromForm] CreateArtworkRequestDto dto,
        IFormFile imageFile)
    {
        var artistId = RequireCurrentUserId();

        var result = await _artworkService.CreateAsync(
            artistId,
            dto,
            imageFile);

        if (!result.IsSuccess)
            return ToActionResult(result);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Value!.Id },
            result.Value);
    }

    /// <summary>
    /// Update artwork metadata.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateArtworkRequestDto dto)
    {
        var artistId = RequireCurrentUserId();

        var result = await _artworkService.UpdateAsync(
            id,
            artistId,
            dto);

        return ToActionResult(result);
    }

    /// <summary>
    /// Replace artwork image.
    /// </summary>
    [HttpPost("{id:guid}/image")]
    [Authorize(Roles = "Artist")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateImage(
        Guid id,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No image file provided." });

        var artistId = RequireCurrentUserId();

        var result = await _artworkService.UpdateImageAsync(
            id,
            artistId,
            file);

        return ToActionResult(result);
    }

    /// <summary>
    /// Bulk update artwork positions.
    /// </summary>
    [HttpPost("positions")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> BulkUpdatePositions(
        [FromBody] List<UpdateArtworkPositionDto> positions)
    {
        if (positions == null || !positions.Any())
            return BadRequest(new { error = "No positions provided." });

        var artistId = RequireCurrentUserId();

        var result = await _artworkService.BulkUpdatePositionsAsync(
            artistId,
            positions);

        return ToActionResult(result);
    }

    /// <summary>
    /// Delete artwork.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var artistId = RequireCurrentUserId();

        var result = await _artworkService.DeleteAsync(
            id,
            artistId);

        return ToActionResult(result);
    }
}