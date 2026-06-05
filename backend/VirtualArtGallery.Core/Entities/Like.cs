using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Likes on artworks (similar to favorites).
/// </summary>
public class Like
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ArtworkId { get; set; }
    public string UserId { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Artwork? Artwork { get; set; }
    public ApplicationUser? User { get; set; }
}