using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Notifications;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Data;


namespace VirtualArtGallery.Application.Services;

public class NotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public NotificationService(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    /// <summary>Create a new notification</summary>
    public async Task<Result<NotificationDto>> CreateNotificationAsync(
        string userId,
        string type,
        string? triggeredByUserId,
        string? triggeredByName,
        Guid? entityId,
        string? entityTitle,
        string message)
    {
        // Don't notify yourself
        if (triggeredByUserId == userId)
            return Result<NotificationDto>.Failure("Cannot notify yourself");

        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            TriggeredByUserId = triggeredByUserId,
            TriggeredByName = triggeredByName,
            EntityId = entityId,
            EntityTitle = entityTitle,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send email notification if enabled
        await SendEmailIfEnabled(
    userId,
    type,
    message,
    type == "like" || type == "review" || type == "comment" || type == "new_artwork"
        ? $"/artwork/{entityId}"
        : type == "follow"
            ? $"/galleries/{triggeredByUserId}"
            : ""
);

        return Result<NotificationDto>.Success(MapToDto(notification));
    }

private async Task SendEmailIfEnabled(string userId, string type, string message, string link)
{
    try
    {
        // Get user notification settings
        var settings = await _context.UserNotificationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null) return;

        bool shouldSend = type switch
        {
            "like" => settings.EmailLikes,
            "follow" => settings.EmailFollows,
            "comment" => settings.EmailComments,
            "review" => settings.EmailReviews,
            "new_artwork" => true,
            _ => false
        };

        if (!shouldSend) return;

        var user = await _context.Users.FindAsync(userId);
        if (user == null || string.IsNullOrEmpty(user.Email)) return;

        // ✅ التصحيح هنا: استخدم `type` و `message` بدلاً من `notification`
        var subject = $"New {type} notification";
        var body = $@"
            <h2>Hello {user.DisplayName},</h2>
            <p>{message}</p>
            <p><a href='https://yourdomain.com{link}'>View details</a></p>
        ";
        await _emailService.SendNotificationEmailAsync(user.Email, subject, body);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to send email notification: {ex.Message}");
    }
}

    /// <summary>Get all notifications for a user</summary>
    public async Task<Result<List<NotificationDto>>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 20)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<List<NotificationDto>>.Success(notifications.Select(MapToDto).ToList());
    }

    /// <summary>Get unread count for a user</summary>
    public async Task<Result<UnreadCountDto>> GetUnreadCountAsync(string userId)
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return Result<UnreadCountDto>.Success(new UnreadCountDto(count));
    }

    /// <summary>Mark a notification as read</summary>
    public async Task<Result> MarkAsReadAsync(string userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return Result.NotFound("Notification not found");

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Result.Success();
    }

    /// <summary>Mark all notifications as read for a user</summary>
    public async Task<Result> MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return Result.Success();
    }

    /// <summary>Delete a notification</summary>
    public async Task<Result> DeleteNotificationAsync(string userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return Result.NotFound("Notification not found");

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return Result.Success();
    }

    private static NotificationDto MapToDto(Notification n) => new(
        n.Id,
        n.Type,
        n.TriggeredByUserId,
        n.TriggeredByName,
        n.EntityId,
        n.EntityTitle,
        n.Message,
        n.IsRead,
        n.CreatedAt
    );
}