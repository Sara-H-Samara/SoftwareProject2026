using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

/// <summary>
/// Artwork CRUD + image upload endpoints.
///
/// Artist-only endpoints (require Artist role):
///   GET    /api/artworks/my            – list own artworks (drafts + published)
///   POST   /api/artworks               – create new artwork with image upload
///   PUT    /api/artworks/{id}          – update artwork metadata
///   POST   /api/artworks/{id}/image    – replace artwork image
///   POST   /api/artworks/positions     – bulk-save 3D layout positions
///   DELETE /api/artworks/{id}          – delete artwork
///
/// Public endpoints:
///   GET /api/artworks/{id}             – get single artwork (if published, or own)
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
        var requestingUserId = GetCurrentUserId(); // null if not authenticated
        var result = await _artworkService.GetByIdAsync(id, requestingUserId);
        return ToActionResult(result);
    }

    // ── Artist-Only ─────────────────────────────────────────────────────────────

    /// <summary>List all artworks owned by the authenticated artist (drafts + published).</summary>
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
    /// Create a new artwork. Accepts multipart/form-data:
    ///   - Artwork metadata fields (title, description, etc.)
    ///   - "imageFile" — the artwork image (jpg/png/webp, max 10MB)
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
        var result = await _artworkService.CreateAsync(artistId, dto, imageFile);

        if (!result.IsSuccess) return ToActionResult(result);

        // 201 Created with Location header pointing to the new resource
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>Update artwork metadata (partial update — only provide fields to change).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateArtworkRequestDto dto)
    {
        var artistId = RequireCurrentUserId();
        var result = await _artworkService.UpdateAsync(id, artistId, dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// Replace the image file for an existing artwork.
    /// Accepts multipart/form-data with a "file" field.
    /// </summary>
    [HttpPost("{id:guid}/image")]
    [Authorize(Roles = "Artist")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateImage(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No image file provided." });

        var artistId = RequireCurrentUserId();
        var result = await _artworkService.UpdateImageAsync(id, artistId, file);
        return ToActionResult(result);
    }

    /// <summary>
    /// Bulk-save 3D positions for all artworks in the gallery layout editor.
    /// Called when the artist clicks "Save Layout".
    /// </summary>
    [HttpPost("positions")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> BulkUpdatePositions([FromBody] List<UpdateArtworkPositionDto> positions)
    {
        if (positions == null || !positions.Any())
            return BadRequest(new { error = "No positions provided." });

        var artistId = RequireCurrentUserId();
        var result = await _artworkService.BulkUpdatePositionsAsync(artistId, positions);
        return ToActionResult(result);
    }

    /// <summary>Delete an artwork and its associated image from Blob Storage.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var artistId = RequireCurrentUserId();
        var result = await _artworkService.DeleteAsync(id, artistId);
        return ToActionResult(result);
    }
}
