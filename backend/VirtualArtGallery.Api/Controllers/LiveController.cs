using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VirtualArtGallery.Application.DTOs.Live;
using VirtualArtGallery.Application.Services.Features;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/live")]
[Authorize]
public class LiveController : ControllerBase
{
    private readonly LiveSessionService _liveService;

    public LiveController(LiveSessionService liveService)
    {
        _liveService = liveService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("userId")!;

    // ── POST api/live/sessions ────────────────────────────────────────────────
    [HttpPost("sessions")]
    [Authorize(Policy = "ArtistOnly")]
    public async Task<IActionResult> StartSession([FromBody] StartSessionRequestDto dto)
    {
        var session = await _liveService.StartSessionAsync(
            UserId, dto.Title, dto.Description,
            dto.MaxVisitors, dto.DurationMinutes, dto.IsPrivate);
        return Ok(session);
    }

    // ── DELETE api/live/sessions/{sessionId} ──────────────────────────────────
    [HttpDelete("sessions/{sessionId:guid}")]
    [Authorize(Policy = "ArtistOnly")]
    public async Task<IActionResult> EndSession(Guid sessionId)
    {
        var ended = await _liveService.EndSessionAsync(sessionId, UserId);
        if (!ended) return NotFound("Session not found or already ended.");
        return NoContent();
    }



    // ── GET api/live/artists/{artistId}/session ───────────────────────────────
    [HttpGet("artists/{artistId}/session")]
[AllowAnonymous]
public async Task<IActionResult> GetActiveSession(string artistId)
{
    try
    {
        var session = await _liveService.GetActiveSessionForArtistAsync(artistId);
        if (session == null) return NotFound();
        return Ok(session);
    }
    catch (Exception)
    {
        return NotFound();
    }
}

    // ── GET api/live/join/{code} — lookup session by invite code ──────────────
    [HttpGet("join/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSessionByCode(string code)
    {
        var session = await _liveService.GetSessionByInviteCodeAsync(code);
        if (session == null) return NotFound("Invalid or expired invite code.");

        // Return only public info (no sensitive data)
        return Ok(new
        {
            session.Id,
            session.Title,
            session.ArtistId,
            ArtistName  = session.Artist?.DisplayName ?? "",
            session.MaxVisitors,
            session.IsPrivate,
            session.InviteCode,
            session.StartedAt,
        });
    }

    // ── POST api/live/sessions/{sessionId}/featured ───────────────────────────
    // Artist selects which artwork is currently on auction
    [HttpPost("sessions/{sessionId:guid}/featured")]
    [Authorize(Policy = "ArtistOnly")]
    public async Task<IActionResult> SetFeaturedArtwork(
        Guid sessionId, [FromBody] SetFeaturedArtworkRequestDto dto)
    {
        var result = await _liveService.SetFeaturedArtworkAsync(
            sessionId, UserId, dto.ArtworkId, dto.StartingBid, dto.BidDurationMin);

        if (!result.Success) return BadRequest(new { error = result.Error });
        return Ok(result.Featured);
    }

    // ── POST api/live/sessions/{sessionId}/close-bidding ─────────────────────
    // Artist closes bidding and declares winner
    [HttpPost("sessions/{sessionId:guid}/close-bidding")]
    [Authorize(Policy = "ArtistOnly")]
    public async Task<IActionResult> CloseBidding(Guid sessionId)
    {
        var winner = await _liveService.CloseBiddingAsync(sessionId, UserId);
        if (winner == null) return Ok(new { message = "Bidding closed. No bids were placed." });
        return Ok(winner);
    }

    // ── GET api/live/sessions/{sessionId}/artworks/{artworkId}/auction ────────
    [HttpGet("sessions/{sessionId:guid}/artworks/{artworkId:guid}/auction")]
    public async Task<IActionResult> GetAuctionState(Guid sessionId, Guid artworkId)
    {
        var state = await _liveService.GetAuctionStateAsync(sessionId, artworkId);
        if (state == null) return NotFound("No bids yet.");
        return Ok(state);
    }
}