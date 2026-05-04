using System;

namespace VirtualArtGallery.Core.Entities;

public class UserNotificationSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public bool EmailLikes { get; set; } = true;
    public bool EmailFollows { get; set; } = true;
    public bool EmailComments { get; set; } = true;
    public bool EmailReviews { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ApplicationUser? User { get; set; }
}