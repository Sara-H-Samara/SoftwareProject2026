using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Core.Constants;

namespace VirtualArtGallery.Api.Controllers;

/// <summary>
/// Converts a Result<T> into the appropriate HTTP response.
/// </summary>

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Converts a <c>Result&lt;T&gt;</c> into the appropriate HTTP response.
    /// Keeps controller action bodies clean — no if/else on IsSuccess everywhere.
    /// </summary>
    protected IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(result.Value);

        return result.StatusCode switch
        {
            400 => BadRequest(new { error = result.Error }),
            401 => Unauthorized(new { error = result.Error }),
            403 => Forbid(),
            404 => NotFound(new { error = result.Error }),
            _ => StatusCode(result.StatusCode, new { error = result.Error })
        };
    }

    /// <summary>Overload for non-generic Result (void operations).</summary>
    protected IActionResult ToActionResult(Result result, object? successData = null)
    {
        if (result.IsSuccess)
            return successData != null ? Ok(successData) : NoContent();

        return result.StatusCode switch
        {
            400 => BadRequest(new { error = result.Error }),
            401 => Unauthorized(new { error = result.Error }),
            403 => Forbid(),
            404 => NotFound(new { error = result.Error }),
            _ => StatusCode(result.StatusCode, new { error = result.Error })
        };
    }

    /// <summary>
    /// Extracts the current authenticated user's ID from JWT claims.
    /// Returns null if not authenticated (should not happen on [Authorize] endpoints).
    /// </summary>
    protected string? GetCurrentUserId()
        => User.FindFirstValue(AppConstants.JwtClaims.UserId);

    /// <summary>Throws if user ID cannot be resolved (defensive helper for [Authorize] endpoints).</summary>
    protected string RequireCurrentUserId()
        => GetCurrentUserId() ?? throw new UnauthorizedAccessException("User ID not found in token.");
}
