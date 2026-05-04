using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Collections;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class CollectionService
{
    private readonly ApplicationDbContext _context;

    public CollectionService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Get all collections for a user
    public async Task<Result<List<CollectionDto>>> GetUserCollectionsAsync(string userId)
    {
        var collections = await _context.Collections
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Include(c => c.Items)
            .ThenInclude(i => i.Artwork)
            .ToListAsync();

        var dtos = collections.Select(MapToDto).ToList();
        return Result<List<CollectionDto>>.Success(dtos);
    }

    // Get a single collection by ID
    public async Task<Result<CollectionDto>> GetCollectionAsync(Guid collectionId, string userId)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
            .ThenInclude(i => i.Artwork)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    // Create a new collection
    public async Task<Result<CollectionDto>> CreateCollectionAsync(string userId, CreateCollectionRequestDto dto)
    {
        var collection = new Collection
        {
            UserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        _context.Collections.Add(collection);
        await _context.SaveChangesAsync();

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    // Update collection metadata
    public async Task<Result<CollectionDto>> UpdateCollectionAsync(Guid collectionId, string userId, UpdateCollectionRequestDto dto)
    {
        var collection = await _context.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        if (dto.Name != null) collection.Name = dto.Name;
        if (dto.Description != null) collection.Description = dto.Description;
        if (dto.IsPublic.HasValue) collection.IsPublic = dto.IsPublic.Value;

        await _context.SaveChangesAsync();

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    // Delete a collection
    public async Task<Result> DeleteCollectionAsync(Guid collectionId, string userId)
    {
        var collection = await _context.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result.NotFound("Collection not found");

        _context.Collections.Remove(collection);
        await _context.SaveChangesAsync();

        return Result.Success();
    }

    // Add artwork to collection
    public async Task<Result<CollectionDto>> AddArtworkToCollectionAsync(Guid collectionId, string userId, Guid artworkId)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
            .ThenInclude(i => i.Artwork)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        // Check if artwork already exists in collection
        if (collection.Items.Any(i => i.ArtworkId == artworkId))
            return Result<CollectionDto>.Failure("Artwork already in collection");

        var artwork = await _context.Artworks.FindAsync(artworkId);
        if (artwork == null)
            return Result<CollectionDto>.NotFound("Artwork not found");

        var maxOrder = collection.Items.Any() ? collection.Items.Max(i => i.Order) : 0;

        var item = new CollectionItem
        {
            CollectionId = collectionId,
            ArtworkId = artworkId,
            Order = maxOrder + 1,
            AddedAt = DateTime.UtcNow
        };

        _context.CollectionItems.Add(item);
        await _context.SaveChangesAsync();

        // Reload collection with new item
        var updatedCollection = await _context.Collections
            .Include(c => c.Items)
            .ThenInclude(i => i.Artwork)
            .FirstOrDefaultAsync(c => c.Id == collectionId);

        return Result<CollectionDto>.Success(MapToDto(updatedCollection!));
    }

    // Remove artwork from collection
    public async Task<Result> RemoveArtworkFromCollectionAsync(Guid collectionId, string userId, Guid artworkId)
    {
        var collection = await _context.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result.NotFound("Collection not found");

        var item = await _context.CollectionItems
            .FirstOrDefaultAsync(i => i.CollectionId == collectionId && i.ArtworkId == artworkId);

        if (item == null)
            return Result.NotFound("Artwork not found in collection");

        _context.CollectionItems.Remove(item);
        
        // Reorder remaining items
        var remainingItems = await _context.CollectionItems
            .Where(i => i.CollectionId == collectionId)
            .OrderBy(i => i.Order)
            .ToListAsync();

        for (int i = 0; i < remainingItems.Count; i++)
        {
            remainingItems[i].Order = i + 1;
        }

        await _context.SaveChangesAsync();
        return Result.Success();
    }

    // Reorder collection items
    public async Task<Result> ReorderCollectionAsync(Guid collectionId, string userId, List<Guid> itemIds)
    {
        var collection = await _context.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result.NotFound("Collection not found");

        var items = await _context.CollectionItems
            .Where(i => i.CollectionId == collectionId)
            .ToListAsync();

        foreach (var item in items)
        {
            var newOrder = itemIds.FindIndex(id => id == item.Id) + 1;
            if (newOrder > 0)
            {
                item.Order = newOrder;
            }
        }

        await _context.SaveChangesAsync();
        return Result.Success();
    }

    // Mapping
    private static CollectionDto MapToDto(Collection c)
    {
        return new CollectionDto(
            c.Id,
            c.Name,
            c.Description,
            c.IsPublic,
            null, // coverImageUrl can be derived from first artwork if needed
            c.Items.Count,
            c.CreatedAt,
            c.Items.Select(i => new CollectionItemDto(
                i.Id,
                i.ArtworkId,
                i.Artwork?.Title ?? "",
                i.Artwork?.ImageUrl ?? "",
                i.Artwork?.Artist?.DisplayName ?? "",
                i.AddedAt
            )).ToList()
        );
    }
}