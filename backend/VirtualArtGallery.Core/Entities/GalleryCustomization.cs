// Core/Entities/GalleryCustomization.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Stores complete gallery customization data for an artist
/// </summary>
public class GalleryCustomization
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string ArtistId { get; set; } = string.Empty;
    
    // All customization sections stored as JSON for flexibility
    [Column(TypeName = "nvarchar(max)")]
    public string StructureJson { get; set; } = "{}";
    
    [Column(TypeName = "nvarchar(max)")]
    public string WallsJson { get; set; } = "{}";
    
    [Column(TypeName = "nvarchar(max)")]
    public string FloorJson { get; set; } = "{}";
    
    [Column(TypeName = "nvarchar(max)")]
    public string LightingJson { get; set; } = "{}";
    
    [Column(TypeName = "nvarchar(max)")]
    public string FurnitureJson { get; set; } = "[]";
    
    [Column(TypeName = "nvarchar(max)")]
    public string EnvironmentJson { get; set; } = "{}";
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsPremium { get; set; } = false;

    public string Shape { get; set; } = "rectangle";

    
    // Navigation property
    [ForeignKey(nameof(ArtistId))]
    public virtual ApplicationUser? Artist { get; set; }
}