using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Activities;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class ActivityService
{
    private readonly ApplicationDbContext _context;

    public ActivityService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ActivityDto>> CreateActivityAsync(
        string userId,
        string type,
        string? actorId,
        string? actorName,
        string? actorAvatar,
        Guid? entityId,
        string? entityTitle,
        string? entityImage,
        string? message)
    {
        var activity = new Activity
        {
            UserId = userId,
            Type = type,
            ActorId = actorId,
            ActorName = actorName,
            ActorAvatar = actorAvatar,
            EntityId = entityId,
            EntityTitle = entityTitle,
            EntityImage = entityImage,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        return Result<ActivityDto>.Success(MapToDto(activity));
    }

    public async Task<Result<ActivityFeedResponseDto>> GetFeedForUserAsync(
        string userId,
        int page = 1,
        int pageSize = 20)
    {
        var currentUser = await _context.Users.FindAsync(userId);
        if (currentUser == null)
            return Result<ActivityFeedResponseDto>.Failure("User not found");

        List<Activity> activities;
        int totalCount;

        if (currentUser.UserType == Core.Enums.UserType.Artist)
        {
            var artistArtworkIds = await _context.Artworks
                .Where(a => a.ArtistId == userId)
                .Select(a => a.Id)
                .ToListAsync();

            var activityQuery = _context.Activities
                .Include(a => a.Actor)
                .Where(a => a.EntityId != null && artistArtworkIds.Contains(a.EntityId.Value))
                .Where(a => a.Type == "like" || a.Type == "review" || a.Type == "comment");

            totalCount = await activityQuery.CountAsync();
            activities = await activityQuery
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
        else
        {
            var followingIds = await _context.Follows
                .Where(f => f.FollowerId == userId)
                .Select(f => f.FollowedId)
                .ToListAsync();

            if (!followingIds.Any())
            {
                return Result<ActivityFeedResponseDto>.Success(new ActivityFeedResponseDto(
                    new List<ActivityDto>(),
                    0,
                    page,
                    pageSize,
                    false
                ));
            }

            var activityQuery = _context.Activities
                .Include(a => a.Actor)
                .Where(a => followingIds.Contains(a.UserId))
                .Where(a => a.Type != "follow"); 

            totalCount = await activityQuery.CountAsync();
            activities = await activityQuery
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        var activityDtos = activities.Select(MapToDto).ToList();

        return Result<ActivityFeedResponseDto>.Success(new ActivityFeedResponseDto(
            activityDtos,
            totalCount,
            page,
            pageSize,
            page * pageSize < totalCount
        ));
    }
    private static ActivityDto MapToDto(Activity a) => new(
        a.Id,
        a.Type,
        a.ActorId,
        a.ActorName,
        a.ActorAvatar,
        a.Actor?.UserType.ToString() ?? "Visitor",  
        a.EntityId,
        a.EntityTitle,
        a.EntityImage,
        a.Message,
        a.CreatedAt
    );
}