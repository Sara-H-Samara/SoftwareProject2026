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

    public AvatarsController(AvatarService avatarService) => _avatarService = avatarService;

    /// <summary>Get the authenticated user's avatar (auto-creates defaults on first call).</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
        => ToActionResult(await _avatarService.GetMineAsync(RequireCurrentUserId()));

    /// <summary>Create or partially update the authenticated user's avatar.</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpsertMine([FromBody] UpdateAvatarRequestDto dto)
        => ToActionResult(await _avatarService.UpsertMineAsync(RequireCurrentUserId(), dto));

    /// <summary>Get another user's avatar (for displaying visitors in the gallery).</summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByUser(string userId)
        => ToActionResult(await _avatarService.GetByUserIdAsync(userId));
}
