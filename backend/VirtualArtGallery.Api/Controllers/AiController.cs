using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.AI;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

/// <summary>
/// AI-powered feature endpoints. Requires authentication to prevent
/// unauthenticated API abuse and for future per-user rate limiting.
///
/// POST /api/ai/describe-artwork   – generate an artwork description
/// POST /api/ai/inspire            – generate creative artwork ideas
/// </summary>
[Route("api/ai")]
[Authorize] // All AI endpoints require a logged-in user
public class AiController : BaseApiController
{
    private readonly AiService _aiService;

    public AiController(AiService aiService)
    {
        _aiService = aiService;
    }

    /// <summary>
    /// Generates a suggested description for an artwork using Azure OpenAI.
    /// Called from the Upload Artwork page when the artist clicks "Suggest with AI".
    /// </summary>
    [HttpPost("describe-artwork")]
    [ProducesResponseType(typeof(SuggestedDescriptionDto), 200)]
    [ProducesResponseType(400)]
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
    public async Task<IActionResult> GetInspiration([FromBody] InspirationPromptDto dto)
    {
        var result = await _aiService.GetInspirationAsync(dto);
        return ToActionResult(result);
    }
}
