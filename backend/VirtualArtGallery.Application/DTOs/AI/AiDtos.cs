namespace VirtualArtGallery.Application.DTOs.AI;



/// <summary>Sent by the frontend when the artist clicks "Suggest Description".</summary>
public record DescriptionPromptDto(
    string Title,
    string ArtworkType,
    string? Materials,
    string? AdditionalContext  
);

/// <summary>AI-generated description returned to the frontend.</summary>
public record SuggestedDescriptionDto(string Description);



/// <summary>Sent by the artist to get creative ideas based on their profile.</summary>
public record InspirationPromptDto(
    string? ArtistBio,
    string? PreferredStyle,
    int NumberOfIdeas = 3
);

/// <summary>AI-generated creative prompts returned to the artist.</summary>
public record InspirationResultDto(string Ideas);
