using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Application.DTOs.Notifications;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/notification-settings")]
[Authorize]
public class NotificationSettingsController : BaseApiController
{
    private readonly NotificationSettingsService _settingsService;

    public NotificationSettingsController(NotificationSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    /// <summary>
    /// Get current user's notification settings
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var userId = RequireCurrentUserId();
        var result = await _settingsService.GetSettingsAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Update user's notification settings
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateNotificationSettingsRequest request)
    {
        var userId = RequireCurrentUserId();
        var result = await _settingsService.UpdateSettingsAsync(userId, request);
        return Ok(result);
    }
}