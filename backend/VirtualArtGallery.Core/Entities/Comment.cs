using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Comments/replies on reviews or directly on artworks.
/// </summary>
public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>Artwork this comment belongs to (nullable if comment is on a review)</summary>
    public Guid? ArtworkId { get; set; }
    
    /// <summary>Review this comment belongs to (nullable if comment is directly on artwork)</summary>
    public Guid? ReviewId { get; set; }
    
    /// <summary>User who wrote the comment</summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>Parent comment ID for nested replies</summary>
    public Guid? ParentCommentId { get; set; }
    
    /// <summary>Comment content</summary>
    public string Content { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Artwork? Artwork { get; set; }
    public Review? Review { get; set; }
    public ApplicationUser? User { get; set; }
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}