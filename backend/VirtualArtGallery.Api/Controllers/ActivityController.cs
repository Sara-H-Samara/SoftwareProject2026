using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivityController : BaseApiController
{
    private readonly ActivityService _activityService;

    public ActivityController(ActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = RequireCurrentUserId();
        var result = await _activityService.GetFeedForUserAsync(userId, page, pageSize);
        return ToActionResult(result);
    }
}