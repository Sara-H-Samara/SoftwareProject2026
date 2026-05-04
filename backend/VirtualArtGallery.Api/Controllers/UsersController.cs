using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly BadgeService _badgeService;

    public UsersController(ApplicationDbContext context, BadgeService badgeService)
    {
        _context = context;
        _badgeService = badgeService;
    }

    /// <summary>
    /// Get all badges earned by a specific user
    /// </summary>
    [HttpGet("{userId}/badges")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<string>), 200)]
    public async Task<IActionResult> GetUserBadges(string userId)
    {
        var result = await _badgeService.GetUserBadgesAsync(userId);
        return Ok(result.Value ?? new List<string>());
    }

    /// <summary>
    /// Check and award badges for the current authenticated user
    /// </summary>
    [HttpPost("badges/check")]
    [Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> CheckBadges()
    {
        var userId = RequireCurrentUserId();
        var result = await _badgeService.CheckAndAwardBadgesAsync(userId);
        return Ok(new { success = result.IsSuccess, message = result.Error });
    }

    /// <summary>
    /// Get public profile information for a user
    /// </summary>
    [HttpGet("{userId}/profile")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserPublicProfileDto), 200)]
    public async Task<IActionResult> GetPublicProfile(string userId)
    {
        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserPublicProfileDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName,
                Email = u.Email,
                UserType = u.UserType,
                GalleryName = u.GalleryName,
                Bio = u.Bio,
                ProfilePicUrl = u.ProfilePicUrl,
                CreatedAt = u.CreatedAt,
                ArtworkCount = _context.Artworks.Count(a => a.ArtistId == userId && a.IsPublished),
                FollowerCount = _context.Follows.Count(f => f.FollowedId == userId),
                FollowingCount = _context.Follows.Count(f => f.FollowerId == userId)
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound(new { error = "User not found" });

        return Ok(user);
    }

    /// <summary>
    /// Get top artists by followers and rating
    /// </summary>
    [HttpGet("top-artists")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<TopArtistDto>), 200)]
    public async Task<IActionResult> GetTopArtists([FromQuery] int limit = 6)
    {
        var topArtists = await _context.Users
            .Where(u => u.UserType == Core.Enums.UserType.Artist)
            .Select(u => new TopArtistDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName,
                GalleryName = u.GalleryName,
                ProfilePicUrl = u.ProfilePicUrl,
                Bio = u.Bio,
                ArtworkCount = _context.Artworks.Count(a => a.ArtistId == u.Id && a.IsPublished),
                FollowerCount = _context.Follows.Count(f => f.FollowedId == u.Id),
                AverageRating = _context.Artworks
                    .Where(a => a.ArtistId == u.Id && a.IsPublished)
                    .SelectMany(a => a.Reviews)
                    .DefaultIfEmpty()
                    .Average(r => r == null ? 0 : r.Rating)
            })
            .OrderByDescending(u => u.FollowerCount)
            .ThenByDescending(u => u.AverageRating)
            .Take(limit)
            .ToListAsync();

        return Ok(topArtists);
    }
}

// DTOs
public class UserPublicProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public Core.Enums.UserType UserType { get; set; }
    public string? GalleryName { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePicUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ArtworkCount { get; set; }
    public int FollowerCount { get; set; }
    public int FollowingCount { get; set; }
}

public class TopArtistDto
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? GalleryName { get; set; }
    public string? ProfilePicUrl { get; set; }
    public string? Bio { get; set; }
    public int ArtworkCount { get; set; }
    public int FollowerCount { get; set; }
    public double AverageRating { get; set; }
}