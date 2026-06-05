namespace VirtualArtGallery.Core.Entities;

public class LiveBid
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SessionId { get; set; }
    public LiveSession Session { get; set; } = null!;

    public Guid ArtworkId { get; set; }
    public Artwork Artwork { get; set; } = null!;

    public string BidderId { get; set; } = null!;
    public ApplicationUser Bidder { get; set; } = null!;

    public decimal Amount { get; set; }
    public DateTime PlacedAt { get; set; } = DateTime.UtcNow;

    public bool IsWinning { get; set; } = false;
}