using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VirtualArtGallery.Application.DTOs.Auth;
using VirtualArtGallery.Application.DTOs.Reviews;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController : BaseApiController  // يرث من BaseApiController
{
    private readonly ReviewService _reviewService;

    public ReviewsController(ReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    // ── Reviews ────────────────────────────────────────────────────────────────
    
    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequestDto dto)
    {
        var userId = RequireCurrentUserId();  // استخدام الدالة الموجودة
        var result = await _reviewService.CreateReviewAsync(userId, dto);
        return ToActionResult(result);  // استخدام ToActionResult بدل HandleResult
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
        var userId = GetCurrentUserId();  // استخدام GetCurrentUserId (قد يكون null)
        if (userId == null)
        {
            var likesCount = await GetLikesCount(artworkId);
            return Ok(new LikeResponseDto(false, likesCount));
        }
            
        var result = await _reviewService.GetLikeStatusAsync(userId, artworkId);
        return ToActionResult(result);
    }
    
    private async Task<int> GetLikesCount(Guid artworkId)
    {
        // محاولة جلب عدد الإعجابات بدون مستخدم
        var result = await _reviewService.GetLikeStatusAsync("", artworkId);
        return result.IsSuccess && result.Value != null ? result.Value.LikesCount : 0;
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
            var followersCount = await GetFollowersCount(artistId);
            return Ok(new FollowResponseDto(false, followersCount, 0));
        }
                
        var result = await _reviewService.GetFollowStatusAsync(followerId, artistId);
        return ToActionResult(result);
    }
    
    private async Task<int> GetFollowersCount(string userId)
    {
        var result = await _reviewService.GetFollowersAsync(userId, 1, 1);
        return result.IsSuccess && result.Value != null ? result.Value.Count : 0;
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
    public async Task<IActionResult> GetArtistStats(string artistId)
    {
        var result = await _reviewService.GetArtistStatsAsync(artistId);
        return ToActionResult(result);
    }
}