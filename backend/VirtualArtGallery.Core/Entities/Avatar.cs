// VirtualArtGallery.Core/Entities/Avatar.cs
using System;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Per-user 3D gallery avatar customization. One avatar per user (unique UserId).
/// Style fields are stored as strings for forward-compatible customization options.
/// </summary>
public class Avatar
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;

    // Physical appearance
    public string SkinColor { get; set; } = "#E8B89E";
    public float Height { get; set; } = 1.0f;

    // Hair
    public string HairStyle { get; set; } = "short";
    public string HairColor { get; set; } = "#3B2A1F";

    // Clothing
    public string ShirtStyle { get; set; } = "tshirt";
    public string ShirtColor { get; set; } = "#3F6FB5";
    public string PantsStyle { get; set; } = "pants";
    public string PantsColor { get; set; } = "#2F2F35";
    public string ShoesColor { get; set; } = "#101015";

    // Accessories
    public string Accessory { get; set; } = "none";
    public string AccessoryColor { get; set; } = "#222222";

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}