using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Rating and review for an artwork from a visitor.
/// </summary>
public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ArtworkId { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    
    public int Rating { get; set; }
    
    public string? Comment { get; set; }
    
    public bool IsApproved { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public Artwork? Artwork { get; set; }
    public ApplicationUser? User { get; set; }
    
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}