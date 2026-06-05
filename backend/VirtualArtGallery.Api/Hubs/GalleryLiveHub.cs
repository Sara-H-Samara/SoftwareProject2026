using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using VirtualArtGallery.Application.Services.Features;
using VirtualArtGallery.Application.DTOs.Live;

namespace VirtualArtGallery.Api.Hubs;

[Authorize]
public class GalleryLiveHub : Hub
{
    // sessionId -> connectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> _sessionVisitors = new();
    // connectionId -> sessionId
    private static readonly ConcurrentDictionary<string, string> _connectionSession = new();
    // connectionId -> (userId, displayName)
    private static readonly ConcurrentDictionary<string, (string UserId, string Name)> _connectionUser = new();
    // sessionId -> chat history (last 200)
    private static readonly ConcurrentDictionary<string, List<ChatMessageDto>> _sessionChat = new();
    // userId -> last reaction time
    private static readonly ConcurrentDictionary<string, DateTime> _lastReaction = new();

    private readonly LiveSessionService _liveService;
    private readonly ILogger<GalleryLiveHub> _logger;

    public GalleryLiveHub(LiveSessionService liveService, ILogger<GalleryLiveHub> logger)
    {
        _liveService = liveService;
        _logger = logger;
    }

    // ── Join session ──────────────────────────────────────────────────────────
    public async Task JoinSession(string sessionId, string displayName)
    {
        var userId = Context.UserIdentifier!;
        var name   = string.IsNullOrWhiteSpace(displayName) ? "Anonymous" : displayName;

        var session = await _liveService.GetActiveSessionAsync(Guid.Parse(sessionId));
        if (session == null)
        {
            await Clients.Caller.SendAsync("SessionError", "Session not found or has ended.");
            return;
        }

        var visitors = _sessionVisitors.GetOrAdd(sessionId, _ => new HashSet<string>());
        lock (visitors)
        {
            if (visitors.Count >= session.MaxVisitors)
            {
                Clients.Caller.SendAsync("SessionError", "Session is full.").Wait();
                return;
            }
            visitors.Add(Context.ConnectionId);
        }

        _connectionSession[Context.ConnectionId] = sessionId;
        _connectionUser[Context.ConnectionId]    = (userId, name);
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);

        var count = GetVisitorCount(sessionId);
        await Clients.Group(sessionId).SendAsync("VisitorCountUpdated", count);
        await Clients.Group(sessionId).SendAsync("UserJoined", new { userId, name });

        // Send chat history to new joiner
        if (_sessionChat.TryGetValue(sessionId, out var history))
            await Clients.Caller.SendAsync("ChatHistory", history);

        // Send current featured artwork to new joiner
        var sessionDto = await _liveService.GetActiveSessionForArtistAsync(session.ArtistId);
        if (sessionDto?.FeaturedArtwork != null)
            await Clients.Caller.SendAsync("FeaturedArtworkChanged", sessionDto.FeaturedArtwork);

        _logger.LogInformation("User {UserId} joined session {SessionId}", userId, sessionId);
    }

    // ── Join by invite code ───────────────────────────────────────────────────
    public async Task JoinByCode(string inviteCode, string displayName)
    {
        var session = await _liveService.GetSessionByInviteCodeAsync(inviteCode);
        if (session == null)
        {
            await Clients.Caller.SendAsync("SessionError", "Invalid invite code.");
            return;
        }
        await JoinSession(session.Id.ToString(), displayName);
    }

    // ── Leave session ─────────────────────────────────────────────────────────
    public async Task LeaveSession(string sessionId)
    {
        var name = _connectionUser.TryGetValue(Context.ConnectionId, out var u) ? u.Name : "Anonymous";
        await RemoveFromSession(sessionId);
        await Clients.Group(sessionId).SendAsync("VisitorCountUpdated", GetVisitorCount(sessionId));
        await Clients.Group(sessionId).SendAsync("UserLeft", new { name });
    }

    // ── Chat ──────────────────────────────────────────────────────────────────
    public async Task SendChatMessage(string sessionId, string message)
    {
        var userId  = Context.UserIdentifier!;
        var name    = _connectionUser.TryGetValue(Context.ConnectionId, out var u) ? u.Name : "Anonymous";
        if (string.IsNullOrWhiteSpace(message) || message.Length > 300) return;

        var session = await _liveService.GetActiveSessionAsync(Guid.Parse(sessionId));
        if (session == null) return;

        var msg = new ChatMessageDto
        {
            UserId   = userId,
            Name     = name,
            Message  = message.Trim(),
            SentAt   = DateTime.UtcNow,
            IsArtist = session.ArtistId == userId,
        };

        var chat = _sessionChat.GetOrAdd(sessionId, _ => new List<ChatMessageDto>());
        lock (chat) { chat.Add(msg); if (chat.Count > 200) chat.RemoveAt(0); }

        await Clients.Group(sessionId).SendAsync("NewChatMessage", msg);
    }

    // ── Reaction ──────────────────────────────────────────────────────────────
    public async Task SendReaction(string sessionId, string artworkId, string emoji)
    {
        var userId  = Context.UserIdentifier!;
        var allowed = new[] { "❤️", "😮", "🔥", "👏" };
        if (!allowed.Contains(emoji)) return;

        var now = DateTime.UtcNow;
        if (_lastReaction.TryGetValue(userId, out var last) && (now - last).TotalSeconds < 1) return;
        _lastReaction[userId] = now;

        if (artworkId != "general")
            await _liveService.SaveReactionAsync(
                Guid.Parse(sessionId), Guid.Parse(artworkId), userId, emoji);

        await Clients.Group(sessionId).SendAsync("NewReaction", new { artworkId, emoji, userId });
    }

    // ── Place bid ─────────────────────────────────────────────────────────────
    public async Task PlaceBid(string sessionId, string artworkId, decimal amount)
    {
        var userId = Context.UserIdentifier!;

        var result = await _liveService.PlaceBidAsync(
            Guid.Parse(sessionId), Guid.Parse(artworkId), userId, amount);

        if (!result.Success)
        {
            await Clients.Caller.SendAsync("BidRejected", result.Error);
            return;
        }

        await Clients.Group(sessionId).SendAsync("BidUpdated", new
        {
            artworkId,
            amount,
            bidderId   = userId,
            bidderName = result.BidderName,
        });

        // System chat message
        var bidMsg = new ChatMessageDto
        {
            UserId   = "system",
            Name     = "🔨 Auction",
            Message  = $"{result.BidderName} placed a bid of ${amount:N0}",
            SentAt   = DateTime.UtcNow,
            IsSystem = true,
        };
        var chat = _sessionChat.GetOrAdd(sessionId, _ => new List<ChatMessageDto>());
        lock (chat) { chat.Add(bidMsg); if (chat.Count > 200) chat.RemoveAt(0); }
        await Clients.Group(sessionId).SendAsync("NewChatMessage", bidMsg);
    }

    // ── Artist: set featured artwork ──────────────────────────────────────────
    // Called via SignalR so all clients instantly see the new artwork
    public async Task SetFeaturedArtwork(string sessionId, string artworkId,
        decimal startingBid, int bidDurationMin)
    {
        var userId = Context.UserIdentifier!;

        var result = await _liveService.SetFeaturedArtworkAsync(
            Guid.Parse(sessionId), userId,
            Guid.Parse(artworkId), startingBid, bidDurationMin);

        if (!result.Success)
        {
            await Clients.Caller.SendAsync("SessionError", result.Error);
            return;
        }

        // Broadcast new featured artwork to ALL viewers
        await Clients.Group(sessionId).SendAsync("FeaturedArtworkChanged", result.Featured);

        // System chat
        var sysMsg = new ChatMessageDto
        {
            UserId   = "system",
            Name     = "🎨 Gallery",
            Message  = $"New artwork on auction: {result.Featured!.Title} — Starting bid: ${startingBid:N0}",
            SentAt   = DateTime.UtcNow,
            IsSystem = true,
        };
        var chat = _sessionChat.GetOrAdd(sessionId, _ => new List<ChatMessageDto>());
        lock (chat) { chat.Add(sysMsg); if (chat.Count > 200) chat.RemoveAt(0); }
        await Clients.Group(sessionId).SendAsync("NewChatMessage", sysMsg);
    }

    // ── Artist: close bidding + declare winner ────────────────────────────────
    public async Task CloseBidding(string sessionId)
    {
        var userId = Context.UserIdentifier!;

        var winner = await _liveService.CloseBiddingAsync(Guid.Parse(sessionId), userId);

        if (winner != null)
        {
            await Clients.Group(sessionId).SendAsync("AuctionWinner", winner);

            var winMsg = new ChatMessageDto
            {
                UserId   = "system",
                Name     = "🏆 Auction",
                Message  = $"{winner.WinnerName} won \"{winner.ArtworkTitle}\" for ${winner.WinningBid:N0}!",
                SentAt   = DateTime.UtcNow,
                IsSystem = true,
            };
            var chat = _sessionChat.GetOrAdd(sessionId, _ => new List<ChatMessageDto>());
            lock (chat) { chat.Add(winMsg); if (chat.Count > 200) chat.RemoveAt(0); }
            await Clients.Group(sessionId).SendAsync("NewChatMessage", winMsg);
        }
        else
        {
            await Clients.Group(sessionId).SendAsync("BiddingClosed", new { sessionId });
        }
    }

    // ── Artist ends session ───────────────────────────────────────────────────
    public async Task EndSession(string sessionId)
    {
        var userId = Context.UserIdentifier!;
        var ended  = await _liveService.EndSessionAsync(Guid.Parse(sessionId), userId);
        if (!ended) { await Clients.Caller.SendAsync("SessionError", "Cannot end session."); return; }

        await Clients.Group(sessionId).SendAsync("SessionEnded", new
        {
            sessionId,
            message = "The artist has ended the live session.",
        });

        _sessionVisitors.TryRemove(sessionId, out _);
        _sessionChat.TryRemove(sessionId, out _);
        _logger.LogInformation("Session {SessionId} ended.", sessionId);
    }

    // ── Disconnect ────────────────────────────────────────────────────────────
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectionSession.TryRemove(Context.ConnectionId, out var sessionId))
        {
            var name = _connectionUser.TryGetValue(Context.ConnectionId, out var u) ? u.Name : "Anonymous";
            await RemoveFromSession(sessionId);
            await Clients.Group(sessionId).SendAsync("VisitorCountUpdated", GetVisitorCount(sessionId));
            await Clients.Group(sessionId).SendAsync("UserLeft", new { name });
        }
        _connectionUser.TryRemove(Context.ConnectionId, out _);
        await base.OnDisconnectedAsync(exception);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private async Task RemoveFromSession(string sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        if (_sessionVisitors.TryGetValue(sessionId, out var visitors))
            lock (visitors) { visitors.Remove(Context.ConnectionId); }
        _connectionSession.TryRemove(Context.ConnectionId, out _);
    }

    private int GetVisitorCount(string sessionId) =>
        _sessionVisitors.TryGetValue(sessionId, out var v) ? v.Count : 0;
}