using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Activities;
using VirtualArtGallery.Application.DTOs.Auth;
using VirtualArtGallery.Application.DTOs.Reviews;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class ReviewService
{
    private readonly ApplicationDbContext _context;
    private readonly NotificationService _notificationService;
    private readonly ActivityService _activityService;

    public ReviewService(
        ApplicationDbContext context, 
        NotificationService notificationService,
        ActivityService activityService)
    {
        _context = context;
        _notificationService = notificationService;
        _activityService = activityService;
    }

    // ── Reviews ────────────────────────────────────────────────────────────────

    public async Task<Result<ReviewResponseDto>> CreateReviewAsync(string userId, CreateReviewRequestDto dto)
    {
        // Check if user already reviewed this artwork
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ArtworkId == dto.ArtworkId && r.UserId == userId);
            
        if (existingReview != null)
            return Result<ReviewResponseDto>.Failure("You have already reviewed this artwork.");
            
        // Check if artwork exists
        var artwork = await _context.Artworks
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == dto.ArtworkId);
        if (artwork == null)
            return Result<ReviewResponseDto>.NotFound("Artwork not found.");
            
        var review = new Review
        {
            ArtworkId = dto.ArtworkId,
            UserId = userId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        
        // Create notification and activity for artwork owner
        if (artwork.ArtistId != userId)
        {
            var user = await _context.Users.FindAsync(userId);
            
            await _notificationService.CreateNotificationAsync(
                artwork.ArtistId,
                "review",
                userId,
                user?.DisplayName ?? user?.Email,
                artwork.Id,
                artwork.Title,
                $"{user?.DisplayName ?? user?.Email} reviewed your artwork \"{artwork.Title}\" with {dto.Rating} stars"
            );
            
            await _activityService.CreateActivityAsync(
                artwork.ArtistId,
                "review",
                userId,
                user?.DisplayName ?? user?.Email,
                user?.ProfilePicUrl,
                artwork.Id,
                artwork.Title,
                artwork.ImageUrl,
                $"{user?.DisplayName ?? user?.Email} reviewed \"{artwork.Title}\" with {dto.Rating} stars"
            );
        }
        
        return Result<ReviewResponseDto>.Success(await MapToReviewDto(review));
    }
    
    public async Task<Result<ReviewResponseDto>> UpdateReviewAsync(string userId, Guid reviewId, UpdateReviewRequestDto dto)
    {
        var review = await _context.Reviews
            .Include(r => r.Artwork)
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);
            
        if (review == null)
            return Result<ReviewResponseDto>.NotFound("Review not found.");
            
        review.Rating = dto.Rating;
        review.Comment = dto.Comment;
        review.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        return Result<ReviewResponseDto>.Success(await MapToReviewDto(review));
    }
    
    public async Task<Result> DeleteReviewAsync(string userId, Guid reviewId)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);
            
        if (review == null)
            return Result.NotFound("Review not found.");
            
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
        
        return Result.Success();
    }
    
    public async Task<Result<List<ReviewResponseDto>>> GetArtworkReviewsAsync(Guid artworkId, int page = 1, int pageSize = 10)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Comments)
                .ThenInclude(c => c.User)
            .Where(r => r.ArtworkId == artworkId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
            
        var reviewDtos = new List<ReviewResponseDto>();
        foreach (var review in reviews)
        {
            reviewDtos.Add(await MapToReviewDto(review));
        }
        
        return Result<List<ReviewResponseDto>>.Success(reviewDtos);
    }
    
    // ── Comments ───────────────────────────────────────────────────────────────
    
    public async Task<Result<CommentResponseDto>> CreateCommentAsync(string userId, CreateCommentRequestDto dto)
    {
        // Validate that either ArtworkId or ReviewId is provided
        if (dto.ArtworkId == null && dto.ReviewId == null)
            return Result<CommentResponseDto>.Failure("Either ArtworkId or ReviewId must be provided.");
            
        var comment = new Comment
        {
            ArtworkId = dto.ArtworkId,
            ReviewId = dto.ReviewId,
            ParentCommentId = dto.ParentCommentId,
            UserId = userId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        
        // Create notification and activity for artwork owner if comment is on artwork
        if (dto.ArtworkId.HasValue)
        {
            var artwork = await _context.Artworks
                .Include(a => a.Artist)
                .FirstOrDefaultAsync(a => a.Id == dto.ArtworkId.Value);
                
            if (artwork != null && artwork.ArtistId != userId)
            {
                var user = await _context.Users.FindAsync(userId);
                
                await _notificationService.CreateNotificationAsync(
                    artwork.ArtistId,
                    "comment",
                    userId,
                    user?.DisplayName ?? user?.Email,
                    artwork.Id,
                    artwork.Title,
                    $"{user?.DisplayName ?? user?.Email} commented on your artwork \"{artwork.Title}\""
                );
                
                await _activityService.CreateActivityAsync(
                    artwork.ArtistId,
                    "comment",
                    userId,
                    user?.DisplayName ?? user?.Email,
                    user?.ProfilePicUrl,
                    artwork.Id,
                    artwork.Title,
                    artwork.ImageUrl,
                    $"{user?.DisplayName ?? user?.Email} commented on \"{artwork.Title}\""
                );
            }
        }
        
        return Result<CommentResponseDto>.Success(await MapToCommentDto(comment));
    }
    
    public async Task<Result> DeleteCommentAsync(string userId, Guid commentId)
    {
        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId);
            
        if (comment == null)
            return Result.NotFound("Comment not found.");
            
        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        
        return Result.Success();
    }
    
    // ── Likes ──────────────────────────────────────────────────────────────────
    
    public async Task<Result<LikeResponseDto>> ToggleLikeAsync(string userId, Guid artworkId)
    {
        var existingLike = await _context.Likes
            .FirstOrDefaultAsync(l => l.ArtworkId == artworkId && l.UserId == userId);
            
        if (existingLike != null)
        {
            _context.Likes.Remove(existingLike);
            await _context.SaveChangesAsync();
        }
        else
        {
            _context.Likes.Add(new Like
            {
                ArtworkId = artworkId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            
            // Create notification and activity for artwork owner
            var artwork = await _context.Artworks
                .Include(a => a.Artist)
                .FirstOrDefaultAsync(a => a.Id == artworkId);
                
            if (artwork != null && artwork.ArtistId != userId)
            {
                var user = await _context.Users.FindAsync(userId);
                
                await _notificationService.CreateNotificationAsync(
                    artwork.ArtistId,
                    "like",
                    userId,
                    user?.DisplayName ?? user?.Email,
                    artwork.Id,
                    artwork.Title,
                    $"{user?.DisplayName ?? user?.Email} liked your artwork \"{artwork.Title}\""
                );
                
                await _activityService.CreateActivityAsync(
                    artwork.ArtistId,
                    "like",
                    userId,
                    user?.DisplayName ?? user?.Email,
                    user?.ProfilePicUrl,
                    artwork.Id,
                    artwork.Title,
                    artwork.ImageUrl,
                    $"{user?.DisplayName ?? user?.Email} liked \"{artwork.Title}\""
                );
            }
        }
        
        var likesCount = await _context.Likes.CountAsync(l => l.ArtworkId == artworkId);
        var isLiked = existingLike == null;
        
        return Result<LikeResponseDto>.Success(new LikeResponseDto(isLiked, likesCount));
    }
    
    public async Task<Result<LikeResponseDto>> GetLikeStatusAsync(string userId, Guid artworkId)
    {
        var isLiked = await _context.Likes
            .AnyAsync(l => l.ArtworkId == artworkId && l.UserId == userId);
            
        var likesCount = await _context.Likes.CountAsync(l => l.ArtworkId == artworkId);
        
        return Result<LikeResponseDto>.Success(new LikeResponseDto(isLiked, likesCount));
    }
    
    // ── Follows ────────────────────────────────────────────────────────────────
    
    public async Task<Result<FollowResponseDto>> ToggleFollowAsync(string followerId, string followedId)
    {
        // Can't follow yourself
        if (followerId == followedId)
            return Result<FollowResponseDto>.Failure("You cannot follow yourself.");
            
        var existingFollow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
            
        if (existingFollow != null)
        {
            _context.Follows.Remove(existingFollow);
            await _context.SaveChangesAsync();
        }
        else
        {
            _context.Follows.Add(new Follow
            {
                FollowerId = followerId,
                FollowedId = followedId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            
            // Create notification and activity for followed artist
            var followedUser = await _context.Users.FindAsync(followedId);
            var follower = await _context.Users.FindAsync(followerId);
            
            if (followedUser != null && follower != null)
            {
                await _notificationService.CreateNotificationAsync(
                    followedId,
                    "follow",
                    followerId,
                    follower.DisplayName ?? follower.Email,
                    null,
                    null,
                    $"{follower.DisplayName ?? follower.Email} started following you"
                );
                
                await _activityService.CreateActivityAsync(
                    followedId,
                    "follow",
                    followerId,
                    follower.DisplayName ?? follower.Email,
                    follower.ProfilePicUrl,
                    null,
                    null,
                    null,
                    $"{follower.DisplayName ?? follower.Email} started following you"
                );
            }
        }
        
        var followersCount = await _context.Follows.CountAsync(f => f.FollowedId == followedId);
        var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == followerId);
        var isFollowing = existingFollow == null;
        
        return Result<FollowResponseDto>.Success(new FollowResponseDto(isFollowing, followersCount, followingCount));
    }
    
    public async Task<Result<FollowResponseDto>> GetFollowStatusAsync(string followerId, string followedId)
    {
        var isFollowing = await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
            
        var followersCount = await _context.Follows.CountAsync(f => f.FollowedId == followedId);
        var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == followerId);
        
        return Result<FollowResponseDto>.Success(new FollowResponseDto(isFollowing, followersCount, followingCount));
    }
    
    public async Task<Result<List<UserProfileDto>>> GetFollowersAsync(string userId, int page = 1, int pageSize = 20)
    {
        var followers = await _context.Follows
            .Include(f => f.Follower)
            .Where(f => f.FollowedId == userId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => MapToProfileDto(f.Follower!))
            .ToListAsync();
            
        return Result<List<UserProfileDto>>.Success(followers);
    }
    
    public async Task<Result<List<UserProfileDto>>> GetFollowingAsync(string userId, int page = 1, int pageSize = 20)
    {
        var following = await _context.Follows
            .Include(f => f.Followed)
            .Where(f => f.FollowerId == userId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => MapToProfileDto(f.Followed!))
            .ToListAsync();
            
        return Result<List<UserProfileDto>>.Success(following);
    }
    
    // ── Artist Analytics ───────────────────────────────────────────────────────
    
    public async Task<Result<ArtistStatsDto>> GetArtistStatsAsync(string artistId)
    {
        var artist = await _context.Users.FindAsync(artistId);
        if (artist == null)
            return Result<ArtistStatsDto>.NotFound("Artist not found.");
            
        var artworks = await _context.Artworks
            .Include(a => a.Likes)
            .Include(a => a.Reviews)
            .Where(a => a.ArtistId == artistId)
            .ToListAsync();
            
        var totalArtworks = artworks.Count;
        var totalLikes = artworks.Sum(a => a.LikesCount);
        var totalReviews = artworks.Sum(a => a.ReviewsCount);
        var averageRating = artworks.Where(a => a.ReviewsCount > 0)
            .Select(a => a.AverageRating)
            .DefaultIfEmpty(0)
            .Average();
        var totalFollowers = await _context.Follows.CountAsync(f => f.FollowedId == artistId);
        
        var topArtworks = artworks
            .OrderByDescending(a => a.LikesCount + a.ReviewsCount * 5)
            .Take(5)
            .Select(a => new ArtworkStatsDto(
                a.Id,
                a.Title,
                a.ImageUrl,
                a.LikesCount,
                0,
                a.ReviewsCount,
                a.AverageRating,
                a.CreatedAt
            ))
            .ToList();
            
        return Result<ArtistStatsDto>.Success(new ArtistStatsDto(
            artistId,
            artist.DisplayName ?? artist.Email!,
            totalArtworks,
            totalLikes,
            totalFollowers,
            averageRating,
            totalReviews,
            0,
            topArtworks
        ));
    }
    
    // ── Private Helpers ────────────────────────────────────────────────────────
    
    private async Task<ReviewResponseDto> MapToReviewDto(Review review)
    {
        var comments = await _context.Comments
            .Include(c => c.User)
            .Where(c => c.ReviewId == review.Id && c.ParentCommentId == null)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
            
        var commentDtos = new List<CommentResponseDto>();
        foreach (var comment in comments)
        {
            commentDtos.Add(await MapToCommentDto(comment));
        }
        
        return new ReviewResponseDto(
            review.Id,
            review.ArtworkId,
            review.Artwork?.Title ?? string.Empty,
            review.UserId,
            review.User?.DisplayName ?? review.User?.Email ?? "Anonymous",
            review.User?.ProfilePicUrl,
            review.Rating,
            review.Comment,
            commentDtos.Count,
            review.IsApproved,
            review.CreatedAt,
            review.UpdatedAt,
            commentDtos
        );
    }
    
    private async Task<CommentResponseDto> MapToCommentDto(Comment comment)
    {
        var replies = await _context.Comments
            .Include(c => c.User)
            .Where(c => c.ParentCommentId == comment.Id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
            
        var replyDtos = new List<CommentResponseDto>();
        foreach (var reply in replies)
        {
            replyDtos.Add(await MapToCommentDto(reply));
        }
        
        return new CommentResponseDto(
            comment.Id,
            comment.UserId,
            comment.User?.DisplayName ?? comment.User?.Email ?? "Anonymous",
            comment.User?.ProfilePicUrl,
            comment.Content,
            replyDtos.Count,
            comment.CreatedAt,
            comment.UpdatedAt,
            replyDtos
        );
    }
    
    private static UserProfileDto MapToProfileDto(ApplicationUser user) => new(
        user.Id,
        user.Email!,
        user.DisplayName,
        user.UserType,
        user.GalleryName,
        user.Bio,
        user.ProfilePicUrl,
        user.CreatedAt
    );
}