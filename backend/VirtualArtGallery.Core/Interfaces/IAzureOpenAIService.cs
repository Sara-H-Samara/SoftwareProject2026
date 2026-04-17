namespace VirtualArtGallery.Core.Interfaces;

/// <summary>
/// Abstraction for AI text generation features.
/// Implemented by AzureOpenAIService using Azure OpenAI or OpenAI SDK.
/// </summary>
public interface IAzureOpenAIService
{
    /// <summary>
    /// Generates a suggested artwork description based on title, type, and materials.
    /// </summary>
    Task<string> GenerateArtworkDescriptionAsync(string title, string artworkType, string? materials, string? additionalContext);

    /// <summary>
    /// Generates creative inspiration prompts for an artist based on their style/genre.
    /// </summary>
    Task<string> GenerateInspirationAsync(string artistBio, string preferredStyle, int numberOfIdeas = 3);

    /// <summary>
    /// General-purpose chat completion for extensibility.
    /// </summary>
    Task<string> GetCompletionAsync(string systemPrompt, string userMessage);
}
