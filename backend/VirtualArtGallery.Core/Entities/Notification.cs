// Core/Entities/Notification.cs
using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Push notification for users when they receive likes, follows, comments, or reviews.
/// </summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string UserId { get; set; } = string.Empty;
    
    public string Type { get; set; } = string.Empty;
    
    public string? TriggeredByUserId { get; set; }
    
    public string? TriggeredByName { get; set; }
    
    public Guid? EntityId { get; set; }
    
    public string? EntityTitle { get; set; }
    
    public string EntityType { get; set; } = "artwork";
    
    public string Message { get; set; } = string.Empty;
    
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ApplicationUser? User { get; set; }
    public ApplicationUser? TriggeredByUser { get; set; }
}