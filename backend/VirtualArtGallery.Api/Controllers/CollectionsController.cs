using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Collections;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CollectionsController : BaseApiController
{
    private readonly CollectionService _collectionService;

    public CollectionsController(CollectionService collectionService)
    {
        _collectionService = collectionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyCollections()
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.GetUserCollectionsAsync(userId);
        return ToActionResult(result);
    }

    [HttpGet("{collectionId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCollection(Guid collectionId)
    {
        var userId = GetCurrentUserId();
        var result = await _collectionService.GetCollectionByIdAsync(collectionId, userId);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCollection([FromBody] CreateCollectionRequest request)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.CreateCollectionAsync(userId, request);
        return ToActionResult(result);
    }

    [HttpPut("{collectionId}")]
    public async Task<IActionResult> UpdateCollection(Guid collectionId, [FromBody] UpdateCollectionRequest request)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.UpdateCollectionAsync(collectionId, userId, request);
        return ToActionResult(result);
    }

    [HttpDelete("{collectionId}")]
    public async Task<IActionResult> DeleteCollection(Guid collectionId)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.DeleteCollectionAsync(collectionId, userId);
        return ToActionResult(result);
    }

    [HttpPost("{collectionId}/items")]
    public async Task<IActionResult> AddToCollection(Guid collectionId, [FromBody] AddToCollectionRequest request)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.AddToCollectionAsync(collectionId, userId, request);
        return ToActionResult(result);
    }

    [HttpDelete("{collectionId}/items/{artworkId}")]
    public async Task<IActionResult> RemoveFromCollection(Guid collectionId, string artworkId)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.RemoveFromCollectionAsync(collectionId, userId, artworkId);
        return ToActionResult(result);
    }

    [HttpPost("{collectionId}/reorder")]
    public async Task<IActionResult> ReorderCollection(Guid collectionId, [FromBody] ReorderCollectionRequest request)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.ReorderCollectionAsync(collectionId, userId, request);
        return ToActionResult(result);
    }
}