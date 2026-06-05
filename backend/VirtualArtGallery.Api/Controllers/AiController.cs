// VirtualArtGallery.Api/Controllers/AiController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VirtualArtGallery.Application.DTOs.AI;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[Route("api/ai")]
[Authorize]
[EnableRateLimiting("AIPolicy")]
public class AiController : BaseApiController
{
    private readonly AiService _aiService;
    private readonly AiArrangementService _aiArrangementService;

    public AiController(AiService aiService, AiArrangementService aiArrangementService)
    {
        _aiService = aiService;
        _aiArrangementService = aiArrangementService;
    }

    /// <summary>
    /// Generates a suggested description for an artwork using Azure OpenAI.
    /// Called from the Upload Artwork page when the artist clicks "Suggest with AI".
    /// </summary>
    [HttpPost("describe-artwork")]
    [ProducesResponseType(typeof(SuggestedDescriptionDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> SuggestDescription([FromBody] DescriptionPromptDto dto)
    {
        var result = await _aiService.SuggestDescriptionAsync(dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// Generates creative artwork inspiration prompts based on the artist's profile.
    /// Called from the artist dashboard's "Get Inspired" feature.
    /// </summary>
    [HttpPost("inspire")]
    [ProducesResponseType(typeof(InspirationResultDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> GetInspiration([FromBody] InspirationPromptDto dto)
    {
        var result = await _aiService.GetInspirationAsync(dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// AI-powered artwork arrangement for gallery layout.
    /// Analyzes artwork properties and suggests optimal placement on gallery walls.
    /// </summary>
    [HttpPost("arrange-artworks")]
    [ProducesResponseType(typeof(ArtworkArrangementResultDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> ArrangeArtworks([FromBody] ArtworkArrangementRequestDto dto)
    {
        var result = await _aiArrangementService.SuggestArrangementAsync(dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// Generates creative title suggestions for an artwork using AI.
    /// </summary>
    [HttpPost("suggest-titles")]
    [ProducesResponseType(typeof(SuggestTitleResponseDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> SuggestTitles([FromBody] SuggestTitleRequestDto dto)
    {
        var result = await _aiService.SuggestTitlesAsync(dto);
        return ToActionResult(result);
    }

     
/// <summary>
/// Analyzes an artwork image and returns suggested title, description,
/// materials, type, and price — all from a single image.
/// Called from the Upload Artwork page after the artist selects an image.
/// </summary>
[HttpPost("analyze-image")]
[ProducesResponseType(typeof(AnalyzeImageResponseDto), 200)]
[ProducesResponseType(400)]
[ProducesResponseType(429)]
public async Task<IActionResult> AnalyzeImage([FromBody] AnalyzeImageRequestDto dto)
{
    if (string.IsNullOrEmpty(dto.ImageUrl))
        return BadRequest("Image URL is required.");
 
    var result = await _aiService.AnalyzeImageForUploadAsync(dto);
    return ToActionResult(result);
}
 
}