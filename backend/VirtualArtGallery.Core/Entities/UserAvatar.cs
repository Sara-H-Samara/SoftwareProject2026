// Core/Entities/UserAvatar.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualArtGallery.Core.Entities;

public class UserAvatar
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string CustomizationJson { get; set; } = "{}";
    
    public string? AvatarName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }
}