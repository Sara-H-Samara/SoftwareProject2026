using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class BadgeService
{
    private readonly ApplicationDbContext _context;

    public BadgeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<string>>> GetUserBadgesAsync(string userId)
    {
        var badges = await _context.UserBadges
            .Where(b => b.UserId == userId)
            .Select(b => b.BadgeType)
            .ToListAsync();

        return Result<List<string>>.Success(badges);
    }

    public async Task<Result> CheckAndAwardBadgesAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Result.Failure("User not found");

        var existingBadges = await _context.UserBadges
            .Where(b => b.UserId == userId)
            .Select(b => b.BadgeType)
            .ToListAsync();

        var newBadges = new List<string>();

        // Check for Verified badge (email confirmed + has gallery)
        if (!existingBadges.Contains("verified") && !string.IsNullOrEmpty(user.GalleryName))
        {
            newBadges.Add("verified");
        }

        // Check for Top Artist badge (top 10% by followers)
        if (!existingBadges.Contains("top"))
        {
            var totalFollowers = await _context.Follows.CountAsync(f => f.FollowedId == userId);
            var allArtistsFollowers = await _context.Follows
                .GroupBy(f => f.FollowedId)
                .Select(g => g.Count())
                .OrderByDescending(c => c)
                .Take(Math.Max(1, (int)(await _context.Users.CountAsync(u => u.UserType == Core.Enums.UserType.Artist) * 0.1)))
                .ToListAsync();
            
            var minTopFollowers = allArtistsFollowers.LastOrDefault();
            if (totalFollowers >= minTopFollowers && minTopFollowers > 0)
            {
                newBadges.Add("top");
            }
        }

        // Check for Rising Star badge (new artist with high engagement)
        if (!existingBadges.Contains("rising") && user.CreatedAt > DateTime.UtcNow.AddMonths(-1))
        {
            var artworks = await _context.Artworks
                .Where(a => a.ArtistId == userId && a.IsPublished)
                .ToListAsync();
            
            var totalLikes = artworks.Sum(a => a.LikesCount);
            var totalReviews = artworks.Sum(a => a.ReviewsCount);
            
            if (totalLikes + totalReviews > 10)
            {
                newBadges.Add("rising");
            }
        }

        // Check for Popular badge (total likes > 100)
        if (!existingBadges.Contains("popular"))
        {
            var artworks = await _context.Artworks
                .Where(a => a.ArtistId == userId && a.IsPublished)
                .ToListAsync();
            
            var totalLikes = artworks.Sum(a => a.LikesCount);
            if (totalLikes > 100)
            {
                newBadges.Add("popular");
            }
        }

        // Check for Master badge (average rating > 4.5 and > 10 reviews)
        if (!existingBadges.Contains("master"))
        {
            var artworks = await _context.Artworks
                .Include(a => a.Reviews)
                .Where(a => a.ArtistId == userId && a.IsPublished)
                .ToListAsync();
            
            var totalReviews = artworks.Sum(a => a.ReviewsCount);
            var averageRating = artworks.Where(a => a.Reviews.Any())
                .Select(a => a.Reviews.Average(r => r.Rating))
                .DefaultIfEmpty(0)
                .Average();
            
            if (totalReviews > 10 && averageRating > 4.5)
            {
                newBadges.Add("master");
            }
        }

        // Award new badges
        foreach (var badgeType in newBadges)
        {
            _context.UserBadges.Add(new UserBadge
            {
                UserId = userId,
                BadgeType = badgeType,
                EarnedAt = DateTime.UtcNow
            });
        }

        if (newBadges.Any())
        {
            await _context.SaveChangesAsync();
        }

        return Result.Success();
    }
}