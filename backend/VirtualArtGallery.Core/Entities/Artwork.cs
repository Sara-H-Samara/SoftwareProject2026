using System.ComponentModel.DataAnnotations;
using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Core.Entities;

public class Artwork
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title       { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl    { get; set; } = string.Empty;
    public string ArtistId    { get; set; } = string.Empty;
    public string? Dimensions { get; set; }
    public string? Materials  { get; set; }
    public int?    Year       { get; set; }
    public decimal? Price     { get; set; }
    public ArtworkType ArtworkType { get; set; } = ArtworkType.Painting;
    public string? AudioUrl   { get; set; }

    // ── 3D Placement ──────────────────────────────────────────────────────────
    public float PositionX { get; set; } = 0f;
    public float PositionY { get; set; } = 1.5f;
    public float PositionZ { get; set; } = 0f;
    public float RotationX { get; set; } = 0f;
    public float RotationY { get; set; } = 0f;
    public float RotationZ { get; set; } = 0f;
    public float ScaleX    { get; set; } = 1f;
    public float ScaleY    { get; set; } = 1f;
    public float ScaleZ    { get; set; } = 1f;

    // ── Visual Analysis (populated by GPT-4 Vision on upload) ─────────────────
    // ColorMood:      "warm" | "cool" | "neutral" | "dark" | "bright"
    // VisualStyle:    "abstract" | "realism" | "impressionism" | "contemporary" | "classical" | "surrealism"
    // Subject:        "portrait" | "landscape" | "still_life" | "abstract" | "urban" | "nature"
    // Mood:           "calm" | "energetic" | "melancholic" | "joyful" | "dramatic" | "serene"
    // DominantColors: comma-separated list e.g. "red,orange,yellow"

    [MaxLength(50)]  public string? ColorMood      { get; set; }
    [MaxLength(50)]  public string? VisualStyle     { get; set; }
    [MaxLength(50)]  public string? Subject         { get; set; }
    [MaxLength(50)]  public string? Mood            { get; set; }
    [MaxLength(200)] public string? DominantColors  { get; set; }
    public bool IsVisuallyAnalyzed { get; set; } = false;

    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<Review>  Reviews  { get; set; } = new List<Review>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like>    Likes    { get; set; } = new List<Like>();

    public int    LikesCount    => Likes?.Count ?? 0;
    public int    ReviewsCount  => Reviews?.Count(r => r.IsApproved) ?? 0;
    public double AverageRating => Reviews?.Where(r => r.IsApproved).Any() == true
        ? Reviews.Where(r => r.IsApproved).Average(r => r.Rating) : 0;

    public ApplicationUser? Artist { get; set; }
}