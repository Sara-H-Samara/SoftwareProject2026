// VirtualArtGallery.Api/Controllers/AvatarsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Avatars;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[Route("api/avatars")]
[Authorize]
public class AvatarsController : BaseApiController
{
    private readonly AvatarService _avatarService;

    public AvatarsController(AvatarService avatarService)
    {
        _avatarService = avatarService;
    }

    /// <summary>
    /// Get the authenticated user's avatar (auto-creates defaults on first call).
    /// GET /api/avatars/me
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(AvatarDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetMine()
    {
        var userId = RequireCurrentUserId();
        var result = await _avatarService.GetMineAsync(userId);
        return ToActionResult(result);
    }

    /// <summary>
    /// Create or partially update the authenticated user's avatar.
    /// PUT /api/avatars/me
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(AvatarDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> UpsertMine([FromBody] UpdateAvatarRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _avatarService.UpsertMineAsync(userId, dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// Get another user's avatar (for displaying visitors in the gallery).
    /// GET /api/avatars/user/{userId}
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AvatarDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByUser(string userId)
    {
        var result = await _avatarService.GetByUserIdAsync(userId);
        return ToActionResult(result);
    }
}