// Api/Controllers/ArtworksController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using VirtualArtGallery.Application.DTOs.Analytics;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Application.Services.Features;
using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Api.Controllers;

[Route("api/artworks")]
public class ArtworksController : BaseApiController
{
    private readonly ArtworkService _artworkService;
    private readonly ExportService _exportService;
    private readonly ArtworkOfTheDayService _artworkOfTheDayService;
    private readonly IHttpClientFactory _httpClientFactory;

    public ArtworksController(
        ArtworkService artworkService,
        ExportService exportService,
        ArtworkOfTheDayService artworkOfTheDayService,
        IHttpClientFactory httpClientFactory)
    {
        _artworkService = artworkService;
        _exportService = exportService;
        _artworkOfTheDayService = artworkOfTheDayService;
        _httpClientFactory = httpClientFactory;
    }

    // ── Image Proxy (fixes Azurite CORS in development) ───────────────────────

    [HttpGet("image-proxy")]
    [AllowAnonymous]
    public async Task<IActionResult> ProxyImage([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url)) return BadRequest();
        try
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode) return NotFound();
            var content = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
            return File(content, contentType);
        }
        catch { return NotFound(); }
    }

    // ── Public ─────────────────────────────────────────────────────────────────

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

    // ── Search ─────────────────────────────────────────────────────────────────

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SearchResultDto<ArtworkDto>), 200)]
    public async Task<IActionResult> SearchArtworks(
        [FromQuery] string? query,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] ArtworkType? artworkType,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var result = await _artworkService.SearchArtworksAsync(
            query, minPrice, maxPrice, artworkType, sortBy, page, pageSize);
        return Ok(result);
    }

    [HttpGet("popular-searches")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(string[]), 200)]
    public IActionResult GetPopularSearches()
    {
        var popularSearches = new[]
        {
            "painting", "landscape", "abstract", "portrait", "modern art",
            "oil painting", "watercolor", "digital art", "sculpture", "photography"
        };
        return Ok(popularSearches);
    }

    [HttpGet("suggestions")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(string[]), 200)]
    public async Task<IActionResult> GetSuggestions([FromQuery] string query)
    {
        if (string.IsNullOrEmpty(query) || query.Length < 2)
            return Ok(Array.Empty<string>());

        var suggestions = await _artworkService.GetSearchSuggestionsAsync(query);
        return Ok(suggestions);
    }

    // ── Analytics ──────────────────────────────────────────────────────────────

    [HttpGet("analytics/summary")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(AnalyticsSummaryDto), 200)]
    public async Task<IActionResult> GetAnalyticsSummary()
    {
        try
        {
            var artistId = RequireCurrentUserId();
            var result = await _artworkService.GetAnalyticsSummaryAsync(artistId);
            return Ok(result);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("analytics/sales")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(List<SalesDataDto>), 200)]
    public async Task<IActionResult> GetSalesData([FromQuery] int months = 6)
    {
        try
        {
            var artistId = RequireCurrentUserId();
            var result = await _artworkService.GetSalesDataAsync(artistId, months);
            return Ok(result);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("analytics/interactions")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(List<InteractionsDataDto>), 200)]
    public async Task<IActionResult> GetInteractionsData([FromQuery] int months = 6)
    {
        try
        {
            var artistId = RequireCurrentUserId();
            var result = await _artworkService.GetInteractionsDataAsync(artistId, months);
            return Ok(result);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Export ─────────────────────────────────────────────────────────────────

    [HttpGet("analytics/export/csv")]
    [Authorize(Roles = "Artist")]
    public async Task<IActionResult> ExportAnalyticsCSV([FromQuery] int months = 6)
    {
        var artistId     = RequireCurrentUserId();
        var summary      = await _artworkService.GetAnalyticsSummaryAsync(artistId);
        var sales        = await _artworkService.GetSalesDataAsync(artistId, months);
        var interactions = await _artworkService.GetInteractionsDataAsync(artistId, months);
        var csv          = _exportService.GenerateAnalyticsCSV(summary, sales, interactions, months);
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"analytics_report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("analytics/export/pdf")]
    [Authorize(Roles = "Artist")]
    public async Task<IActionResult> ExportAnalyticsPDF([FromQuery] int months = 6)
    {
        var artistId     = RequireCurrentUserId();
        var summary      = await _artworkService.GetAnalyticsSummaryAsync(artistId);
        var sales        = await _artworkService.GetSalesDataAsync(artistId, months);
        var interactions = await _artworkService.GetInteractionsDataAsync(artistId, months);
        var pdf          = _exportService.GenerateAnalyticsPDF(summary, sales, interactions, months);
        return File(pdf, "application/pdf", $"analytics_report_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    // ── Artist-Only ─────────────────────────────────────────────────────────────

    [HttpGet("my")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(List<ArtworkDto>), 200)]
    public async Task<IActionResult> GetMyArtworks()
    {
        var artistId = RequireCurrentUserId();
        var result   = await _artworkService.GetMyArtworksAsync(artistId);
        return ToActionResult(result);
    }

    [HttpPost]
    [Authorize(Roles = "Artist")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ArtworkDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromForm] CreateArtworkRequestDto dto, IFormFile imageFile)
    {
        var artistId = RequireCurrentUserId();
        var result   = await _artworkService.CreateAsync(artistId, dto, imageFile);
        if (!result.IsSuccess) return ToActionResult(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateArtworkRequestDto dto)
    {
        var artistId = RequireCurrentUserId();
        var result   = await _artworkService.UpdateAsync(id, artistId, dto);
        return ToActionResult(result);
    }

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
        var result   = await _artworkService.UpdateImageAsync(id, artistId, file);
        return ToActionResult(result);
    }

    [HttpPost("positions")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> BulkUpdatePositions([FromBody] List<UpdateArtworkPositionDto> positions)
    {
        if (positions == null || !positions.Any())
            return BadRequest(new { error = "No positions provided." });
        var artistId = RequireCurrentUserId();
        var result   = await _artworkService.BulkUpdatePositionsAsync(artistId, positions);
        return ToActionResult(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Artist")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var artistId = RequireCurrentUserId();
        var result   = await _artworkService.DeleteAsync(id, artistId);
        return ToActionResult(result);
    }

    // ── Artwork of the Day ─────────────────────────────────────────────────────

    [HttpGet("artwork-of-the-day")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ArtworkDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetArtworkOfTheDay()
    {
        var result = await _artworkOfTheDayService.GetTodaysArtworkAsync();
        if (!result.IsSuccess || result.Value == null)
            return NotFound(new { error = result.Error ?? "No artwork found" });

        return Ok(MapToDto(result.Value));
    }

    [HttpPost("{artworkId:guid}/vote")]
    [Authorize]
    [ProducesResponseType(typeof(VoteResponseDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> VoteForArtwork(Guid artworkId)
    {
        var userId = RequireCurrentUserId();
        var result = await _artworkOfTheDayService.VoteForArtworkAsync(userId, artworkId.ToString());
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(new VoteResponseDto { TotalVotes = result.Value });
    }

    [HttpGet("{artworkId:guid}/votes")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VoteResponseDto), 200)]
    public async Task<IActionResult> GetVotesForArtwork(Guid artworkId)
    {
        var result = await _artworkOfTheDayService.GetVotesForArtworkAsync(artworkId.ToString());
        return Ok(new VoteResponseDto { TotalVotes = result.Value });
    }

    [HttpGet("user/can-vote")]
    [Authorize]
    [ProducesResponseType(typeof(CanVoteResponseDto), 200)]
    public async Task<IActionResult> CanUserVote()
    {
        var userId = RequireCurrentUserId();
        var result = await _artworkOfTheDayService.HasUserVotedThisWeekAsync(userId);
        return Ok(new CanVoteResponseDto { CanVote = !result.Value });
    }

    [HttpGet("leaderboard")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<ArtworkDto>), 200)]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int limit = 10)
    {
        var result = await _artworkOfTheDayService.GetMonthlyLeaderboardAsync(limit);
        if (!result.IsSuccess || result.Value == null) return Ok(new List<ArtworkDto>());
        return Ok(result.Value.Select(MapToDto).ToList());
    }

    // ── Private helper ────────────────────────────────────────────────────────
    private static ArtworkDto MapToDto(VirtualArtGallery.Core.Entities.Artwork a) => new(
        Id: a.Id, Title: a.Title, Description: a.Description, ImageUrl: a.ImageUrl,
        ArtistId: a.ArtistId, ArtistName: a.Artist?.DisplayName ?? a.Artist?.Email,
        Dimensions: a.Dimensions, Materials: a.Materials, Year: a.Year, Price: a.Price,
        ArtworkType: a.ArtworkType, AudioUrl: a.AudioUrl, IsPublished: a.IsPublished,
        PositionX: a.PositionX, PositionY: a.PositionY, PositionZ: a.PositionZ,
        RotationX: a.RotationX, RotationY: a.RotationY, RotationZ: a.RotationZ,
        ScaleX: a.ScaleX, ScaleY: a.ScaleY, ScaleZ: a.ScaleZ,
        CreatedAt: a.CreatedAt, UpdatedAt: a.UpdatedAt,
        ColorMood: a.ColorMood, VisualStyle: a.VisualStyle, Subject: a.Subject,
        Mood: a.Mood, DominantColors: a.DominantColors,
        IsVisuallyAnalyzed: a.IsVisuallyAnalyzed
    );
}

public class VoteResponseDto    { public int  TotalVotes { get; set; } }
public class CanVoteResponseDto { public bool CanVote    { get; set; } }