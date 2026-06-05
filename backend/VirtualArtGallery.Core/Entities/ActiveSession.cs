// Core/Entities/ActiveSession.cs
using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Real-time active visitor session in a gallery
/// </summary>
public class ActiveSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ConnectionId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string GalleryId { get; set; } = string.Empty;
    public Guid AvatarId { get; set; }
    public float PositionX { get; set; }
    public float PositionZ { get; set; }
    public float Rotation { get; set; }
    public string? CurrentAnimation { get; set; }
    public Guid? ViewingArtworkId { get; set; }
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public virtual ApplicationUser? User { get; set; }
    public virtual UserAvatar? Avatar { get; set; }
}