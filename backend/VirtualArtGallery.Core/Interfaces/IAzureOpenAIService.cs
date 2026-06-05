namespace VirtualArtGallery.Core.Interfaces;
public interface IAzureOpenAIService
{
    Task<string> GenerateArtworkDescriptionAsync(
        string title, string artworkType, string? materials, string? additionalContext);

    Task<string> GenerateInspirationAsync(
        string artistBio, string preferredStyle, int numberOfIdeas = 3);

    Task<GalleryArrangementResult> ArrangeGalleryAsync(
        List<ArtworkForArrangementInput> artworks, int wallCount);

    Task<string> GetStructuredArrangementAsync(string prompt);

    Task<string> GetCompletionAsync(string systemPrompt, string userMessage);

    Task<List<string>> SuggestTitlesAsync(
    string? description, string? artworkType, string? materials,
    string? additionalContext, string? imageUrl = null);

    Task<ArtworkVisualAnalysis> AnalyzeArtworkImageAsync(
        string imageUrl, string title, string artworkType, string? description);

    Task<string> AnalyzeImageForUploadAsync(
    string imageUrl, string? artworkType = null);
 
}

// ── Shared types ──────────────────────────────────────────────────────────────

public record ArtworkForArrangementInput(
    string  Id,
    string  Title,
    string  ArtworkType,
    string? Materials,
    string? Description,
    string? Dimensions,
    string? ColorMood,
    string? VisualStyle,
    string? Subject,
    string? Mood,
    string? DominantColors);

public record ArtworkPlacement(
    string ArtworkId,
    int    WallGroup,
    int    OrderWithinGroup);

public record GalleryArrangementResult(
    List<ArtworkPlacement> Placements,
    string                 CuratorNote);

public record ArtworkVisualAnalysis(
    string ColorMood,       // warm | cool | neutral | dark | bright
    string VisualStyle,     // abstract | realism | impressionism | contemporary | classical | surrealism
    string Subject,         // portrait | landscape | still_life | abstract | urban | nature
    string Mood,            // calm | energetic | melancholic | joyful | dramatic | serene
    string DominantColors); // comma-separated: "red,orange,yellow"

