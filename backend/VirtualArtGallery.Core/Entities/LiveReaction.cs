namespace VirtualArtGallery.Core.Entities;

public class LiveReaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SessionId { get; set; }
    public LiveSession Session { get; set; } = null!;

    public Guid ArtworkId { get; set; }

    public string UserId { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;

    public string Emoji { get; set; } = null!; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}