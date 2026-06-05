using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Entities.Features;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services.Features;

public class ArtworkOfTheDayService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ArtworkOfTheDayService> _logger;

    public ArtworkOfTheDayService(
        ApplicationDbContext context,
        ILogger<ArtworkOfTheDayService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get today's featured artwork. If none exists, select a random one.
    /// </summary>
    public async Task<Result<Artwork>> GetTodaysArtworkAsync()
    {
        var today = DateTime.UtcNow.Date;
        
        var todaysArtwork = await _context.ArtworksOfTheDay
            .Include(a => a.Artwork)
                .ThenInclude(a => a!.Artist)
            .FirstOrDefaultAsync(a => a.Date == today);

        if (todaysArtwork?.Artwork != null)
        {
            _logger.LogInformation("Returning existing artwork of the day: {Title}", todaysArtwork.Artwork.Title);
            return Result<Artwork>.Success(todaysArtwork.Artwork);
        }

        var availableArtworks = await _context.Artworks
            .Include(a => a.Artist)
            .Where(a => a.IsPublished)
            .ToListAsync();

        if (!availableArtworks.Any())
        {
            _logger.LogWarning("No published artworks available for Artwork of the Day");
            return Result<Artwork>.Failure("No artworks available");
        }

        var random = new Random(Guid.NewGuid().GetHashCode());
        var selected = availableArtworks[random.Next(availableArtworks.Count)];

        var newArtworkOfDay = new ArtworkOfTheDay
        {
            ArtworkId = selected.Id,  
            Date = today,
            VotesCount = 0
        };

        _context.ArtworksOfTheDay.Add(newArtworkOfDay);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Selected new artwork of the day: {Title} by {Artist}", 
            selected.Title, selected.Artist?.DisplayName);

        return Result<Artwork>.Success(selected);
    }

    /// <summary>
    /// Vote for an artwork (limited to once per week per user)
    /// </summary>
    public async Task<Result<int>> VoteForArtworkAsync(string userId, string artworkId)
    {
        // Parse artworkId to Guid
        if (!Guid.TryParse(artworkId, out var artworkGuid))
            return Result<int>.Failure("Invalid artwork ID", 400);

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return Result<int>.Failure("User not found", 404);

        var artwork = await _context.Artworks.FindAsync(artworkGuid);
        if (artwork == null || !artwork.IsPublished)
            return Result<int>.Failure("Artwork not found or not published", 404);

        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var existingVote = await _context.ArtworkVotes
            .FirstOrDefaultAsync(v => v.UserId == userId && v.VotedAt >= weekAgo);

        if (existingVote != null)
        {
            _logger.LogWarning("User {UserId} tried to vote again within the week", userId);
            return Result<int>.Failure("You can only vote once per week", 400);
        }

        var vote = new ArtworkVote
        {
            ArtworkId = artworkGuid,  
            UserId = userId,
            VotedAt = DateTime.UtcNow
        };

        _context.ArtworkVotes.Add(vote);
        
        var today = DateTime.UtcNow.Date;
        var artworkOfDay = await _context.ArtworksOfTheDay
            .FirstOrDefaultAsync(a => a.ArtworkId == artworkGuid && a.Date == today);
        
        if (artworkOfDay != null)
        {
            artworkOfDay.VotesCount++;
        }

        await _context.SaveChangesAsync();

        var totalVotes = await _context.ArtworkVotes
            .CountAsync(v => v.ArtworkId == artworkGuid);

        _logger.LogInformation("User {UserId} voted for artwork {ArtworkId}. Total votes: {TotalVotes}", 
            userId, artworkId, totalVotes);

        return Result<int>.Success(totalVotes);
    }

    /// <summary>
    /// Get total votes for a specific artwork
    /// </summary>
    public async Task<Result<int>> GetVotesForArtworkAsync(string artworkId)
    {
        if (!Guid.TryParse(artworkId, out var artworkGuid))
            return Result<int>.Success(0);

        var totalVotes = await _context.ArtworkVotes
            .CountAsync(v => v.ArtworkId == artworkGuid);
        
        return Result<int>.Success(totalVotes);
    }

    /// <summary>
    /// Check if a user has voted in the last 7 days
    /// </summary>
    public async Task<Result<bool>> HasUserVotedThisWeekAsync(string userId)
    {
        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var hasVoted = await _context.ArtworkVotes
            .AnyAsync(v => v.UserId == userId && v.VotedAt >= weekAgo);
        
        return Result<bool>.Success(hasVoted);
    }

    /// <summary>
    /// Get the most voted artwork of the current month
    /// </summary>
    public async Task<Result<List<Artwork>>> GetMonthlyLeaderboardAsync(int limit = 10)
    {
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        
        var leaderboard = await _context.ArtworkVotes
            .Where(v => v.VotedAt >= startOfMonth)
            .GroupBy(v => v.ArtworkId)
            .Select(g => new
            {
                ArtworkId = g.Key,
                VoteCount = g.Count()
            })
            .OrderByDescending(x => x.VoteCount)
            .Take(limit)
            .ToListAsync();

        var artworkIds = leaderboard.Select(x => x.ArtworkId).ToList();
        
        var artworks = await _context.Artworks
            .Include(a => a.Artist)
            .Where(a => artworkIds.Contains(a.Id))
            .ToListAsync();

        var orderedArtworks = leaderboard
            .Join(artworks, l => l.ArtworkId, a => a.Id, (l, a) => new { Artwork = a, l.VoteCount })
            .OrderByDescending(x => x.VoteCount)
            .Select(x => x.Artwork)
            .ToList();

        return Result<List<Artwork>>.Success(orderedArtworks);
    }
}