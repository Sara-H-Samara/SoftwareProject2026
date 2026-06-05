namespace VirtualArtGallery.Core.Entities;

public class LiveSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string ArtistId { get; set; } = null!;
    public ApplicationUser Artist { get; set; } = null!;

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    public int MaxVisitors { get; set; } = 50;
    public int CurrentVisitorCount { get; set; } = 0;

    // ── Invite system ─────────────────────────────────────────────────────────
    /// <summary>6-char alphanumeric code guests use to join (e.g. "ART42X")</summary>
    public string InviteCode { get; set; } = GenerateCode();

    public bool IsPrivate { get; set; } = false;   // if true, only invite-code holders can join

    // ── Auction ───────────────────────────────────────────────────────────────
    /// <summary>The artwork currently on the auction block. Null = no artwork selected yet.</summary>
    public Guid? FeaturedArtworkId { get; set; }

    /// <summary>Minimum starting bid for the featured artwork.</summary>
    public decimal? StartingBid { get; set; }

    /// <summary>When the current artwork's bidding window closes. Null = open-ended.</summary>
    public DateTime? BidEndsAt { get; set; }

    /// <summary>True while an artwork is actively accepting bids.</summary>
    public bool BiddingOpen { get; set; } = false;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndsAt   { get; set; }
    public DateTime? EndedAt  { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<LiveBid>      Bids      { get; set; } = new List<LiveBid>();
    public ICollection<LiveReaction> Reactions { get; set; } = new List<LiveReaction>();

    // ─────────────────────────────────────────────────────────────────────────
    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
        var rng = new Random();
        return new string(Enumerable.Range(0, 6).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
    }
}