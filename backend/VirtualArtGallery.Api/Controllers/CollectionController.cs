using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.DTOs.Collections;
using VirtualArtGallery.Application.Services;

namespace VirtualArtGallery.Api.Controllers;

[Route("api/collections")]
[Authorize]
public class CollectionController : BaseApiController
{
    private readonly CollectionService _collectionService;

    public CollectionController(CollectionService collectionService)
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
    public async Task<IActionResult> GetCollection(Guid collectionId)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.GetCollectionAsync(collectionId, userId);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCollection([FromBody] CreateCollectionRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.CreateCollectionAsync(userId, dto);
        return ToActionResult(result);
    }

    [HttpPut("{collectionId}")]
    public async Task<IActionResult> UpdateCollection(Guid collectionId, [FromBody] UpdateCollectionRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.UpdateCollectionAsync(collectionId, userId, dto);
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
    public async Task<IActionResult> AddToCollection(Guid collectionId, [FromBody] AddToCollectionRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.AddArtworkToCollectionAsync(collectionId, userId, dto.ArtworkId);
        return ToActionResult(result);
    }

    [HttpDelete("{collectionId}/items/{artworkId}")]
    public async Task<IActionResult> RemoveFromCollection(Guid collectionId, Guid artworkId)
    {
        var userId = RequireCurrentUserId();
        var result = await _collectionService.RemoveArtworkFromCollectionAsync(collectionId, userId, artworkId);
        return ToActionResult(result);
    }

    [HttpPost("{collectionId}/reorder")]
    public async Task<IActionResult> ReorderCollection(Guid collectionId, [FromBody] ReorderCollectionRequestDto dto)
    {
        var userId = RequireCurrentUserId();
        // استخرج قائمة الـ GUIDs من الـ DTO
        var result = await _collectionService.ReorderCollectionAsync(collectionId, userId, dto.ItemIds);
        return ToActionResult(result);
    }
}