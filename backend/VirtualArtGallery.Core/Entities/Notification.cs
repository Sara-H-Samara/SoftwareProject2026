using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Push notification for users when they receive likes, follows, comments, or reviews.
/// </summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>User who receives the notification</summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>Type of notification: Like, Follow, Comment, Review</summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>User who triggered the notification (if applicable)</summary>
    public string? TriggeredByUserId { get; set; }
    
    /// <summary>Name of the user who triggered the notification</summary>
    public string? TriggeredByName { get; set; }
    
    /// <summary>Related entity ID (artworkId, commentId, etc.)</summary>
    public Guid? EntityId { get; set; }
    
    /// <summary>Title of the related artwork (if applicable)</summary>
    public string? EntityTitle { get; set; }
    
    /// <summary>Notification message</summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>Whether the notification has been read</summary>
    public bool IsRead { get; set; } = false;
    
    /// <summary>When the notification was created</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ApplicationUser? User { get; set; }
    public ApplicationUser? TriggeredByUser { get; set; }
}