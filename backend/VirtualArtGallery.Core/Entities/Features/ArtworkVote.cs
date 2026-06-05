using System;

namespace VirtualArtGallery.Core.Entities.Features;

public class ArtworkVote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ArtworkId { get; set; } 
    
    public string UserId { get; set; } = string.Empty;
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
    
    public Artwork? Artwork { get; set; }
    public ApplicationUser? User { get; set; }
}
