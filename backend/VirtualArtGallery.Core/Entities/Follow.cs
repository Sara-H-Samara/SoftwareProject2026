using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Follow relationship between users (visitors follow artists).
/// </summary>
public class Follow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string FollowerId { get; set; } = string.Empty;
    
    public string FollowedId { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ApplicationUser? Follower { get; set; }
    public ApplicationUser? Followed { get; set; }
}