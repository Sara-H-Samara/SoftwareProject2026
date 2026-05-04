using System;

namespace VirtualArtGallery.Core.Entities;

public class Activity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? ActorAvatar { get; set; }
    public Guid? EntityId { get; set; }
    public string? EntityTitle { get; set; }
    public string? EntityImage { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ApplicationUser? User { get; set; }
    public ApplicationUser? Actor { get; set; }
}