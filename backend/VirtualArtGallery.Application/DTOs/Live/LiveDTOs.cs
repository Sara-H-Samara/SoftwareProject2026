namespace VirtualArtGallery.Application.DTOs.Live;

// ── Session ───────────────────────────────────────────────────────────────────
public class LiveSessionDto
{
    public Guid    Id                  { get; set; }
    public string  ArtistId            { get; set; } = null!;
    public string  ArtistName          { get; set; } = null!;
    public string  Title               { get; set; } = null!;
    public string? Description         { get; set; }
    public int     MaxVisitors         { get; set; }
    public int     CurrentVisitorCount { get; set; }
    public string  InviteCode          { get; set; } = null!;
    public bool    IsPrivate           { get; set; }
    public DateTime  StartedAt         { get; set; }
    public DateTime? EndsAt            { get; set; }
    public bool    IsActive            { get; set; }
    public FeaturedArtworkDto? FeaturedArtwork { get; set; }
}

public class FeaturedArtworkDto
{
    public Guid    ArtworkId    { get; set; }
    public string  Title        { get; set; } = null!;
    public string  ImageUrl     { get; set; } = null!;
    public decimal StartingBid  { get; set; }
    public decimal TopBid       { get; set; }
    public string? TopBidder    { get; set; }
    public int     TotalBids    { get; set; }
    public bool    BiddingOpen  { get; set; }
    public DateTime? BidEndsAt  { get; set; }
}

// ── Requests ──────────────────────────────────────────────────────────────────
public class StartSessionRequestDto
{
    public string  Title           { get; set; } = null!;
    public string? Description     { get; set; }
    public int     MaxVisitors     { get; set; } = 50;
    public int     DurationMinutes { get; set; } = 60;
    public bool    IsPrivate       { get; set; } = false;
}

public class SetFeaturedArtworkRequestDto
{
    public Guid    ArtworkId      { get; set; }
    public decimal StartingBid    { get; set; } = 0;
    public int     BidDurationMin { get; set; } = 5;  
}

// ── Auction ───────────────────────────────────────────────────────────────────
public class AuctionStateDto
{
    public Guid    ArtworkId     { get; set; }
    public decimal TopBidAmount  { get; set; }
    public string  TopBidderName { get; set; } = null!;
    public int     TotalBids     { get; set; }
}

public class AuctionWinnerDto
{
    public Guid    ArtworkId     { get; set; }
    public string  ArtworkTitle  { get; set; } = null!;
    public string  WinnerId      { get; set; } = null!;
    public string  WinnerName    { get; set; } = null!;
    public decimal WinningBid    { get; set; }
}

// ── Chat ──────────────────────────────────────────────────────────────────────
public class ChatMessageDto
{
    public string   UserId   { get; set; } = null!;
    public string   Name     { get; set; } = null!;
    public string   Message  { get; set; } = null!;
    public DateTime SentAt   { get; set; }
    public bool     IsArtist { get; set; }
    public bool     IsSystem { get; set; }
}