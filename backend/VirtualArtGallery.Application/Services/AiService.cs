using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.AI;
using VirtualArtGallery.Core.Interfaces;

namespace VirtualArtGallery.Application.Services;

/// <summary>
/// Thin orchestration layer between the API controllers and the AI infrastructure.
/// Keeps AI-specific prompt engineering centralized and controllers clean.
/// 
/// Future extensions:
///   - Rate limiting per user (prevent abuse of AI calls)
///   - Caching repeated prompts
///   - Usage logging for cost tracking
/// </summary>
public class AiService
{
    private readonly IAzureOpenAIService _openAI;

    public AiService(IAzureOpenAIService openAI)
    {
        _openAI = openAI;
    }

    /// <summary>
    /// Generates a suggested description for an artwork based on its metadata.
    /// Called from UploadArtworkPage when the artist clicks "Suggest with AI".
    /// </summary>
    public async Task<Result<SuggestedDescriptionDto>> SuggestDescriptionAsync(DescriptionPromptDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return Result<SuggestedDescriptionDto>.Failure("Artwork title is required to generate a description.");

        var description = await _openAI.GenerateArtworkDescriptionAsync(
            dto.Title,
            dto.ArtworkType,
            dto.Materials,
            dto.AdditionalContext);

        return Result<SuggestedDescriptionDto>.Success(new SuggestedDescriptionDto(description));
    }

    /// <summary>
    /// Generates creative artwork ideas tailored to the artist's style and bio.
    /// Helps artists overcome creative blocks.
    /// </summary>
    public async Task<Result<InspirationResultDto>> GetInspirationAsync(InspirationPromptDto dto)
    {
        var ideas = await _openAI.GenerateInspirationAsync(
            dto.ArtistBio ?? "A creative art student",
            dto.PreferredStyle ?? "mixed media",
            dto.NumberOfIdeas);

        return Result<InspirationResultDto>.Success(new InspirationResultDto(ideas));
    }
}
