using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Notifications;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>Get all notifications for the current user</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = RequireCurrentUserId();
        var result = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
        return ToActionResult(result);
    }

    /// <summary>Get unread count for the current user</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = RequireCurrentUserId();
        var result = await _notificationService.GetUnreadCountAsync(userId);
        return ToActionResult(result);
    }

    /// <summary>Mark a notification as read</summary>
    [HttpPost("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var userId = RequireCurrentUserId();
        var result = await _notificationService.MarkAsReadAsync(userId, notificationId);
        return ToActionResult(result);
    }

    /// <summary>Mark all notifications as read</summary>
    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = RequireCurrentUserId();
        var result = await _notificationService.MarkAllAsReadAsync(userId);
        return ToActionResult(result);
    }

    /// <summary>Delete a notification</summary>
    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification(Guid notificationId)
    {
        var userId = RequireCurrentUserId();
        var result = await _notificationService.DeleteNotificationAsync(userId, notificationId);
        return ToActionResult(result);
    }
}