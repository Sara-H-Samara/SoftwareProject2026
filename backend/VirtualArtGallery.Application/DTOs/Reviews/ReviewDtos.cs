namespace VirtualArtGallery.Application.DTOs.Reviews;

// ── Request DTOs ─────────────────────────────────────────────────────────────

public record CreateReviewRequestDto(
    Guid ArtworkId,
    int Rating,
    string? Comment
);

public record UpdateReviewRequestDto(
    int Rating,
    string? Comment
);

public record CreateCommentRequestDto(
    Guid? ArtworkId,
    Guid? ReviewId,
    Guid? ParentCommentId,
    string Content
);

public record UpdateCommentRequestDto(
    string Content
);

// ── Response DTOs ─────────────────────────────────────────────────────────────

public record ReviewResponseDto(
    Guid Id,
    Guid ArtworkId,
    string ArtworkTitle,
    string UserId,
    string UserName,
    string? UserAvatar,
    int Rating,
    string? Comment,
    int CommentsCount,
    bool IsApproved,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<CommentResponseDto> Comments
);

public record CommentResponseDto(
    Guid Id,
    string UserId,
    string UserName,
    string? UserAvatar,
    string Content,
    int RepliesCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<CommentResponseDto> Replies
);

public record LikeResponseDto(
    bool IsLiked,
    int LikesCount
);

public record FollowResponseDto(
    bool IsFollowing,
    int FollowersCount,
    int FollowingCount
);

public record ArtistStatsDto(
    string ArtistId,
    string ArtistName,
    int TotalArtworks,
    int TotalLikes,
    int TotalFollowers,
    double AverageRating,
    int TotalReviews,
    int TotalViews,
    List<ArtworkStatsDto> TopArtworks
);

public record ArtworkStatsDto(
    Guid ArtworkId,
    string Title,
    string ImageUrl,
    int LikesCount,
    int ViewsCount,
    int ReviewsCount,
    double AverageRating,
    DateTime CreatedAt
);