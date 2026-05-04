using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Rating and review for an artwork from a visitor.
/// </summary>
public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>Artwork being reviewed</summary>
    public Guid ArtworkId { get; set; }
    
    /// <summary>User who wrote the review</summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>Rating from 1 to 5 stars</summary>
    public int Rating { get; set; }
    
    /// <summary>Optional text review</summary>
    public string? Comment { get; set; }
    
    /// <summary>Whether this review is approved (for moderation)</summary>
    public bool IsApproved { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Artwork? Artwork { get; set; }
    public ApplicationUser? User { get; set; }
    
    // Replies to this review (comments)
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}