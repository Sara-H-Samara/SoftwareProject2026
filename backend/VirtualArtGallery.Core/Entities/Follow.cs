using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Follow relationship between users (visitors follow artists).
/// </summary>
public class Follow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>User who is following (follower)</summary>
    public string FollowerId { get; set; } = string.Empty;
    
    /// <summary>Artist being followed (followed)</summary>
    public string FollowedId { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ApplicationUser? Follower { get; set; }
    public ApplicationUser? Followed { get; set; }
}