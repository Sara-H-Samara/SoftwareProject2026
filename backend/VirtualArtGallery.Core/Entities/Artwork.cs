using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Core.Entities;

/// <summary>
/// Represents a piece of art uploaded by an artist.
/// Includes both metadata (title, description) and 3D placement data
/// (position, rotation, scale) used to position the artwork inside the virtual gallery room.
/// </summary>
public class Artwork
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Title of the artwork (e.g., "Sunset Over the Bay").</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Artist-written or AI-assisted description of the piece.</summary>
    public string? Description { get; set; }

    /// <summary>URL to the artwork image stored in Azure Blob Storage.</summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Foreign key to the artist (ApplicationUser) who owns this artwork.</summary>
    public string ArtistId { get; set; } = string.Empty;

    /// <summary>Physical/digital dimensions (e.g., "24in x 36in").</summary>
    public string? Dimensions { get; set; }

    /// <summary>Materials used (e.g., "Oil on canvas", "Digital - Procreate").</summary>
    public string? Materials { get; set; }

    /// <summary>Year the artwork was created.</summary>
    public int? Year { get; set; }

    /// <summary>Optional price in USD if the artwork is for sale.</summary>
    public decimal? Price { get; set; }

    /// <summary>Category of the artwork.</summary>
    public ArtworkType ArtworkType { get; set; } = ArtworkType.Painting;

    // ── 3D Placement Data ──────────────────────────────────────────────────────
    // These values are used by Three.js / @react-three/fiber to place the artwork
    // mesh inside the gallery_room.glb scene. Defaults center it in the room.

    public float PositionX { get; set; } = 0f;
    public float PositionY { get; set; } = 1.5f; // Eye-level height
    public float PositionZ { get; set; } = 0f;

    public float RotationX { get; set; } = 0f;
    public float RotationY { get; set; } = 0f;
    public float RotationZ { get; set; } = 0f;

    public float ScaleX { get; set; } = 1f;
    public float ScaleY { get; set; } = 1f;
    public float ScaleZ { get; set; } = 1f;

    /// <summary>Whether this artwork is visible to public visitors.</summary>
    public bool IsPublished { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ApplicationUser? Artist { get; set; }
}
