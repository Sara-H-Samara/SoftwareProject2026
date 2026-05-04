using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;
using VirtualArtGallery.Application.DTOs.Notifications;

namespace VirtualArtGallery.Application.Services;

public class NotificationSettingsService
{
    private readonly ApplicationDbContext _context;

    public NotificationSettingsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserNotificationSettingsDto> GetSettingsAsync(string userId)
    {
        var settings = await _context.UserNotificationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserNotificationSettings { UserId = userId };
            _context.UserNotificationSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return new UserNotificationSettingsDto
        {
            EmailLikes = settings.EmailLikes,
            EmailFollows = settings.EmailFollows,
            EmailComments = settings.EmailComments,
            EmailReviews = settings.EmailReviews
        };
    }

    public async Task<UserNotificationSettingsDto> UpdateSettingsAsync(string userId, UpdateNotificationSettingsRequest request)
    {
        var settings = await _context.UserNotificationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserNotificationSettings { UserId = userId };
            _context.UserNotificationSettings.Add(settings);
        }

        settings.EmailLikes = request.EmailLikes;
        settings.EmailFollows = request.EmailFollows;
        settings.EmailComments = request.EmailComments;
        settings.EmailReviews = request.EmailReviews;
        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new UserNotificationSettingsDto
        {
            EmailLikes = settings.EmailLikes,
            EmailFollows = settings.EmailFollows,
            EmailComments = settings.EmailComments,
            EmailReviews = settings.EmailReviews
        };
    }
}