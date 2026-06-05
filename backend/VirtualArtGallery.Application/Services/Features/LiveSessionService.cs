using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VirtualArtGallery.Application.DTOs.Live;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services.Features;

public class LiveSessionService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<LiveSessionService> _logger;

    public LiveSessionService(ApplicationDbContext db, ILogger<LiveSessionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Start session ─────────────────────────────────────────────────────────
    public async Task<LiveSessionDto> StartSessionAsync(
        string artistId, string title, string? description,
        int maxVisitors, int durationMinutes, bool isPrivate)
    {
        // Close any existing active sessions for this artist
        var existing = await _db.LiveSessions
            .Where(s => s.ArtistId == artistId && s.IsActive)
            .ToListAsync();
        foreach (var s in existing) { s.IsActive = false; s.EndedAt = DateTime.UtcNow; }

        var session = new LiveSession
        {
            ArtistId    = artistId,
            Title       = title,
            Description = description,
            MaxVisitors = Math.Clamp(maxVisitors, 1, 500),
            IsPrivate   = isPrivate,
            StartedAt   = DateTime.UtcNow,
            EndsAt      = durationMinutes > 0 ? DateTime.UtcNow.AddMinutes(durationMinutes) : null,
            IsActive    = true,
        };

        _db.LiveSessions.Add(session);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Artist {ArtistId} started session {SessionId} (code={Code})",
            artistId, session.Id, session.InviteCode);

        return await MapToDtoAsync(session);
    }

    // ── Join by invite code ───────────────────────────────────────────────────
    public async Task<LiveSession?> GetSessionByInviteCodeAsync(string code) =>
        await _db.LiveSessions
            .Include(s => s.Artist)
            .FirstOrDefaultAsync(s =>
                s.InviteCode == code.ToUpper() && s.IsActive);

    // ── Get active session by id ──────────────────────────────────────────────
    public async Task<LiveSession?> GetActiveSessionAsync(Guid sessionId) =>
        await _db.LiveSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.IsActive);

    // ── Get active session for artist ─────────────────────────────────────────
    public async Task<LiveSessionDto?> GetActiveSessionForArtistAsync(string artistId)
    {
        var session = await _db.LiveSessions
            .Include(s => s.Artist)
            .FirstOrDefaultAsync(s => s.ArtistId == artistId && s.IsActive);

        if (session == null) return null;

        if (session.EndsAt.HasValue && session.EndsAt < DateTime.UtcNow)
        {
            session.IsActive = false; session.EndedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return null;
        }

        return await MapToDtoAsync(session);
    }

    // ── Set featured artwork (artist picks which artwork is on auction) ────────
    public async Task<SetFeaturedResult> SetFeaturedArtworkAsync(
        Guid sessionId, string artistId,
        Guid artworkId, decimal startingBid, int bidDurationMin)
    {
        var session = await _db.LiveSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.ArtistId == artistId && s.IsActive);
        if (session == null)
            return new SetFeaturedResult(false, "Session not found.", null);

        var artwork = await _db.Artworks.FindAsync(artworkId);
        if (artwork == null)
            return new SetFeaturedResult(false, "Artwork not found.", null);

        session.FeaturedArtworkId = artworkId;
        session.StartingBid       = startingBid;
        session.BiddingOpen       = true;
        session.BidEndsAt         = bidDurationMin > 0
            ? DateTime.UtcNow.AddMinutes(bidDurationMin)
            : null;

        await _db.SaveChangesAsync();

        var featured = await BuildFeaturedDtoAsync(session);
        return new SetFeaturedResult(true, null, featured);
    }

    // ── Close bidding for current artwork and declare winner ──────────────────
    public async Task<AuctionWinnerDto?> CloseBiddingAsync(Guid sessionId, string artistId)
    {
        var session = await _db.LiveSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.ArtistId == artistId && s.IsActive);
        if (session == null || !session.BiddingOpen || session.FeaturedArtworkId == null)
            return null;

        session.BiddingOpen = false;
        await _db.SaveChangesAsync();

        // Find winning bid
        var winningBid = await _db.LiveBids
            .Include(b => b.Bidder)
            .Include(b => b.Artwork)
            .Where(b => b.SessionId == sessionId &&
                        b.ArtworkId == session.FeaturedArtworkId &&
                        b.IsWinning)
            .FirstOrDefaultAsync();

        if (winningBid == null) return null;

        return new AuctionWinnerDto
        {
            ArtworkId    = winningBid.ArtworkId,
            ArtworkTitle = winningBid.Artwork.Title,
            WinnerId     = winningBid.BidderId,
            WinnerName   = winningBid.Bidder.DisplayName ?? "Anonymous",
            WinningBid   = winningBid.Amount,
        };
    }

    // ── Place a bid ───────────────────────────────────────────────────────────
    public async Task<BidResult> PlaceBidAsync(
        Guid sessionId, Guid artworkId, string bidderId, decimal amount)
    {
        var session = await GetActiveSessionAsync(sessionId);
        if (session == null)
            return new BidResult(false, "Session is not active.", null);

        if (!session.BiddingOpen || session.FeaturedArtworkId != artworkId)
            return new BidResult(false, "Bidding is not open for this artwork.", null);

        // Check bid window expiry
        if (session.BidEndsAt.HasValue && session.BidEndsAt < DateTime.UtcNow)
        {
            session.BiddingOpen = false;
            await _db.SaveChangesAsync();
            return new BidResult(false, "Bidding window has closed.", null);
        }

        // Must beat starting bid
        if (session.StartingBid.HasValue && amount < session.StartingBid.Value)
            return new BidResult(false,
                $"Bid must be at least {session.StartingBid.Value:C}.", null);

        var topBid = await _db.LiveBids
            .Where(b => b.SessionId == sessionId && b.ArtworkId == artworkId)
            .OrderByDescending(b => b.Amount)
            .FirstOrDefaultAsync();

        if (topBid != null && amount <= topBid.Amount)
            return new BidResult(false,
                $"Bid must be higher than current top bid of {topBid.Amount:C}.", null);

        if (topBid != null) topBid.IsWinning = false;

        var user = await _db.Users.FindAsync(bidderId);

        _db.LiveBids.Add(new LiveBid
        {
            SessionId = sessionId,
            ArtworkId = artworkId,
            BidderId  = bidderId,
            Amount    = amount,
            IsWinning = true,
        });
        await _db.SaveChangesAsync();

        return new BidResult(true, null, user?.DisplayName ?? "Anonymous");
    }

    // ── Save reaction ─────────────────────────────────────────────────────────
    public async Task SaveReactionAsync(
        Guid sessionId, Guid artworkId, string userId, string emoji)
    {
        _db.LiveReactions.Add(new LiveReaction
        {
            SessionId = sessionId,
            ArtworkId = artworkId,
            UserId    = userId,
            Emoji     = emoji,
        });
        await _db.SaveChangesAsync();
    }

    // ── End session ───────────────────────────────────────────────────────────
    public async Task<bool> EndSessionAsync(Guid sessionId, string artistId)
    {
        var session = await _db.LiveSessions
            .FirstOrDefaultAsync(s =>
                s.Id == sessionId && s.ArtistId == artistId && s.IsActive);
        if (session == null) return false;

        session.IsActive    = false;
        session.BiddingOpen = false;
        session.EndedAt     = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Get auction state ─────────────────────────────────────────────────────
    public async Task<AuctionStateDto?> GetAuctionStateAsync(Guid sessionId, Guid artworkId)
    {
        var topBid = await _db.LiveBids
            .Include(b => b.Bidder)
            .Where(b => b.SessionId == sessionId && b.ArtworkId == artworkId)
            .OrderByDescending(b => b.Amount)
            .FirstOrDefaultAsync();

        if (topBid == null) return null;

        return new AuctionStateDto
        {
            ArtworkId     = artworkId,
            TopBidAmount  = topBid.Amount,
            TopBidderName = topBid.Bidder.DisplayName ?? "Anonymous",
            TotalBids     = await _db.LiveBids
                .CountAsync(b => b.SessionId == sessionId && b.ArtworkId == artworkId),
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private async Task<FeaturedArtworkDto?> BuildFeaturedDtoAsync(LiveSession session)
    {
        if (session.FeaturedArtworkId == null) return null;

        var artwork = await _db.Artworks.FindAsync(session.FeaturedArtworkId.Value);
        if (artwork == null) return null;

        var topBid = await _db.LiveBids
            .Include(b => b.Bidder)
            .Where(b => b.SessionId == session.Id &&
                        b.ArtworkId == session.FeaturedArtworkId &&
                        b.IsWinning)
            .FirstOrDefaultAsync();

        return new FeaturedArtworkDto
        {
            ArtworkId   = artwork.Id,
            Title       = artwork.Title,
            ImageUrl    = artwork.ImageUrl,
            StartingBid = session.StartingBid ?? 0,
            TopBid      = topBid?.Amount ?? 0,
            TopBidder   = topBid?.Bidder.DisplayName,
            TotalBids   = await _db.LiveBids.CountAsync(b =>
                b.SessionId == session.Id && b.ArtworkId == session.FeaturedArtworkId),
            BiddingOpen = session.BiddingOpen,
            BidEndsAt   = session.BidEndsAt,
        };
    }

    private async Task<LiveSessionDto> MapToDtoAsync(LiveSession s) => new()
    {
        Id                  = s.Id,
        ArtistId            = s.ArtistId,
        ArtistName          = s.Artist?.DisplayName ?? "",
        Title               = s.Title,
        Description         = s.Description,
        MaxVisitors         = s.MaxVisitors,
        InviteCode          = s.InviteCode,
        IsPrivate           = s.IsPrivate,
        StartedAt           = s.StartedAt,
        EndsAt              = s.EndsAt,
        IsActive            = s.IsActive,
        FeaturedArtwork     = await BuildFeaturedDtoAsync(s),
    };
}

public record BidResult(bool Success, string? Error, string? BidderName);
public record SetFeaturedResult(bool Success, string? Error, FeaturedArtworkDto? Featured);