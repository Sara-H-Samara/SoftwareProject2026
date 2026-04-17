using Microsoft.AspNetCore.Identity;
using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Extends ASP.NET Core Identity's IdentityUser with gallery-specific profile data.
/// Artists can create and manage galleries; Visitors can browse them.
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>Whether this user is an Artist (can upload/manage artworks) or a Visitor (browse only).</summary>
    public UserType UserType { get; set; } = UserType.Visitor;

    /// <summary>Display name for the artist's virtual gallery (e.g., "Jane's Modern Art Space").</summary>
    public string? GalleryName { get; set; }

    /// <summary>Short biography shown on the artist's public gallery page.</summary>
    public string? Bio { get; set; }

    /// <summary>URL to profile picture stored in Azure Blob Storage.</summary>
    public string? ProfilePicUrl { get; set; }

    /// <summary>Display name shown across the platform.</summary>
    public string? DisplayName { get; set; }

    /// <summary>JWT refresh token stored server-side for token rotation.</summary>
    public string? RefreshToken { get; set; }

    /// <summary>Expiry time for the stored refresh token.</summary>
    public DateTime? RefreshTokenExpiryTime { get; set; }

    /// <summary>Timestamp of account creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Artwork> Artworks { get; set; } = new List<Artwork>();
}
