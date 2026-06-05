// Api/Controllers/ReviewsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.DTOs.Reviews;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController : BaseApiController
{
    private readonly ReviewService _reviewService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(
        ReviewService reviewService,
        ApplicationDbContext context,
        ILogger<ReviewsController> logger)
    {
        _reviewService = reviewService;
        _context = context;
        _logger = logger;
    }

    // ── Reviews ────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _reviewService.CreateReviewAsync(userId, dto);
        return ToActionResult(result);
    }

    [HttpPut("{reviewId}")]
    public async Task<IActionResult> UpdateReview(Guid reviewId, [FromBody] UpdateReviewRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _reviewService.UpdateReviewAsync(userId, reviewId, dto);
        return ToActionResult(result);
    }

    [HttpDelete("{reviewId}")]
    public async Task<IActionResult> DeleteReview(Guid reviewId)
    {
        var userId = RequireCurrentUserId();
        var result = await _reviewService.DeleteReviewAsync(userId, reviewId);
        return ToActionResult(result);
    }

    [HttpGet("artwork/{artworkId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetArtworkReviews(Guid artworkId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _reviewService.GetArtworkReviewsAsync(artworkId, page, pageSize);
        return ToActionResult(result);
    }

    // ── Comments ───────────────────────────────────────────────────────────────

    [HttpPost("comments")]
    public async Task<IActionResult> CreateComment([FromBody] CreateCommentRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _reviewService.CreateCommentAsync(userId, dto);
        return ToActionResult(result);
    }

    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var userId = RequireCurrentUserId();
        var result = await _reviewService.DeleteCommentAsync(userId, commentId);
        return ToActionResult(result);
    }

    // ── Likes ──────────────────────────────────────────────────────────────────

    [HttpPost("artwork/{artworkId}/like")]
    public async Task<IActionResult> ToggleLike(Guid artworkId)
    {
        var userId = RequireCurrentUserId();
        var result = await _reviewService.ToggleLikeAsync(userId, artworkId);
        return ToActionResult(result);
    }

    [HttpGet("artwork/{artworkId}/like-status")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLikeStatus(Guid artworkId)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            var likesCount = await _context.Likes.CountAsync(l => l.ArtworkId == artworkId);
            return Ok(new LikeResponseDto(false, likesCount));
        }

        var result = await _reviewService.GetLikeStatusAsync(userId, artworkId);
        return ToActionResult(result);
    }

    // ── Follows ────────────────────────────────────────────────────────────────

    [HttpPost("follow/{artistId}")]
    public async Task<IActionResult> ToggleFollow(string artistId)
    {
        var followerId = RequireCurrentUserId();
        var result = await _reviewService.ToggleFollowAsync(followerId, artistId);
        return ToActionResult(result);
    }

    [HttpGet("follow-status/{artistId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFollowStatus(string artistId)
    {
        var followerId = GetCurrentUserId();

        if (followerId == null)
        {
            var followersCount = await _context.Follows.CountAsync(f => f.FollowedId == artistId);
            return Ok(new FollowResponseDto(false, followersCount, 0));
        }

        var result = await _reviewService.GetFollowStatusAsync(followerId, artistId);
        return ToActionResult(result);
    }

    [HttpGet("followers/{userId}")]
    public async Task<IActionResult> GetFollowers(string userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _reviewService.GetFollowersAsync(userId, page, pageSize);
        return ToActionResult(result);
    }

    [HttpGet("following/{userId}")]
    public async Task<IActionResult> GetFollowing(string userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _reviewService.GetFollowingAsync(userId, page, pageSize);
        return ToActionResult(result);
    }

    // ── Analytics ──────────────────────────────────────────────────────────────

    [HttpGet("artist/{artistId}/stats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ArtistStatsDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetArtistStats(string artistId)
    {
        try
        {
            if (string.IsNullOrEmpty(artistId))
                return NotFound(new { error = "Artist ID is required" });

            var artist = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == artistId && u.UserType == Core.Enums.UserType.Artist);

            if (artist == null)
                return NotFound(new { error = "Artist not found" });

            var result = await _reviewService.GetArtistStatsAsync(artistId);

            if (!result.IsSuccess)
                return NotFound(new { error = result.Error ?? "Artist not found" });

            return Ok(result.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting artist stats for {ArtistId}", artistId);
            return NotFound(new { error = "Artist not found" });
        }
    }
}