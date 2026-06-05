// Api/Controllers/GalleryCustomizationController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.GalleryCustomization;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/gallery")]
[Authorize]
public class GalleryCustomizationController : BaseApiController
{
    private readonly GalleryCustomizationService _customizationService;
    private readonly ILogger<GalleryCustomizationController> _logger;

    public GalleryCustomizationController(
        GalleryCustomizationService customizationService,
        ILogger<GalleryCustomizationController> logger)
    {
        _customizationService = customizationService;
        _logger = logger;
    }

    /// <summary>
    /// Get current artist's gallery customization
    /// GET: /api/gallery/customization
    /// </summary>
    [HttpGet("customization")]
    [ProducesResponseType(typeof(GalleryCustomizationDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetCustomization()
    {
        var userId = RequireCurrentUserId();
        var result = await _customizationService.GetCustomizationAsync(userId);
        return ToActionResult(result);
    }

    /// <summary>
    /// Get any artist's gallery customization (public — for visitors)
    /// GET: /api/gallery/{artistId}/customization
    /// </summary>
    [HttpGet("{artistId}/customization")]
    [AllowAnonymous] 
    [ProducesResponseType(typeof(GalleryCustomizationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCustomizationByArtist(string artistId)
    {
        var result = await _customizationService.GetCustomizationAsync(artistId);
        if (result == null || !result.IsSuccess || result.Value == null)
            return NotFound(new { error = "No customization found for this artist" });
        
        return Ok(result.Value);
    }

    /// <summary>
    /// Save gallery customization
    /// PUT: /api/gallery/customization
    /// </summary>
    [HttpPut("customization")]
    [ProducesResponseType(typeof(GalleryCustomizationDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> SaveCustomization([FromBody] GalleryCustomizationDto dto)
    {
        if (dto == null)
            return BadRequest(new { error = "Customization data is required" });

        var userId = RequireCurrentUserId();
        var result = await _customizationService.SaveCustomizationAsync(userId, dto);
        return ToActionResult(result);
    }

    /// <summary>
    /// Reset customization to default
    /// POST: /api/gallery/customization/reset
    /// </summary>
    [HttpPost("customization/reset")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ResetCustomization()
    {
        var userId = RequireCurrentUserId();
        var result = await _customizationService.ResetCustomizationAsync(userId);
        return ToActionResult(result);
    }

    /// <summary>
    /// Get subscription status
    /// GET: /api/gallery/subscription
    /// </summary>
    [HttpGet("subscription")]
    [ProducesResponseType(typeof(SubscriptionStatusDto), 200)]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        var userId = RequireCurrentUserId();
        
        // TODO: Implement actual subscription check with Stripe
        return Ok(new SubscriptionStatusDto 
        { 
            IsActive = false,
            Plan = null,
            Message = "Premium subscription required for advanced features"
        });
    }

    /// <summary>
    /// Create subscription checkout session
    /// POST: /api/gallery/subscription/create
    /// </summary>
    [HttpPost("subscription/create")]
    [ProducesResponseType(typeof(CheckoutResponseDto), 200)]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionRequestDto request)
    {
        var userId = RequireCurrentUserId();
        
        // TODO: Integrate with Stripe API
        return Ok(new CheckoutResponseDto 
        { 
            CheckoutUrl = "https://stripe.com/checkout/demo"
        });
    }
}

public class SubscriptionStatusDto
{
    public bool IsActive { get; set; }
    public string? Plan { get; set; }
    public string? Message { get; set; }
}

public class CreateSubscriptionRequestDto
{
    public string PlanId { get; set; } = string.Empty;
}

public class CheckoutResponseDto
{
    public string CheckoutUrl { get; set; } = string.Empty;
}