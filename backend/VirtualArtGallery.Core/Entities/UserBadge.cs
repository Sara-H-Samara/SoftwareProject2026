using System;

namespace VirtualArtGallery.Core.Entities;

public class UserBadge
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string BadgeType { get; set; } = string.Empty;
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    
    public ApplicationUser? User { get; set; }
}