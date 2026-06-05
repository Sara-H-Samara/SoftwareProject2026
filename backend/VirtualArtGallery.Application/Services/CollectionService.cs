// Application/Services/CollectionService.cs
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

    public async Task<Result<CollectionDto>> CreateCollectionAsync(string userId, CreateCollectionRequest request)
    {
        var collection = new Collection
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        _context.Collections.Add(collection);
        await _context.SaveChangesAsync();

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    public async Task<Result<List<CollectionDto>>> GetUserCollectionsAsync(string userId)
    {

        var collections = await _context.Collections
            .Include(c => c.Items)
                .ThenInclude(i => i.Artwork)
                    .ThenInclude(a => a!.Artist)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Result<List<CollectionDto>>.Success(collections.Select(MapToDto).ToList());
    }

    public async Task<Result<CollectionDto>> GetCollectionByIdAsync(Guid collectionId, string? requestingUserId)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
                .ThenInclude(i => i.Artwork)
                    .ThenInclude(a => a!.Artist)
            .FirstOrDefaultAsync(c => c.Id == collectionId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        if (!collection.IsPublic && collection.UserId != requestingUserId)
            return Result<CollectionDto>.Forbidden("This collection is private");

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    public async Task<Result<CollectionDto>> UpdateCollectionAsync(Guid collectionId, string userId, UpdateCollectionRequest request)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
                .ThenInclude(i => i.Artwork)
                    .ThenInclude(a => a!.Artist)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        if (request.Name != null) collection.Name = request.Name;
        if (request.Description != null) collection.Description = request.Description;
        if (request.IsPublic.HasValue) collection.IsPublic = request.IsPublic.Value;
        collection.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

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

    public async Task<Result<CollectionDto>> AddToCollectionAsync(Guid collectionId, string userId, AddToCollectionRequest request)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
                .ThenInclude(i => i.Artwork)
                    .ThenInclude(a => a!.Artist)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        var artworkId = Guid.Parse(request.ArtworkId);
        var artwork = await _context.Artworks.FindAsync(artworkId);
        if (artwork == null)
            return Result<CollectionDto>.NotFound("Artwork not found");

        if (collection.Items.Any(i => i.ArtworkId == artworkId))
            return Result<CollectionDto>.Failure("Artwork already in collection");

        var maxOrder = collection.Items.Any() ? collection.Items.Max(i => i.Order) : 0;

        var item = new CollectionItem
        {
            CollectionId = collectionId,
            ArtworkId = artworkId,
            AddedAt = DateTime.UtcNow,
            Order = maxOrder + 1
        };

        _context.CollectionItems.Add(item);
        await _context.SaveChangesAsync();

        if (string.IsNullOrEmpty(collection.CoverImageUrl))
        {
            collection.CoverImageUrl = artwork.ImageUrl;
            await _context.SaveChangesAsync();
        }

        await _context.Entry(collection).Collection(c => c.Items).LoadAsync();
        foreach (var ci in collection.Items)
            await _context.Entry(ci).Reference(i => i.Artwork).LoadAsync();

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    public async Task<Result<CollectionDto>> RemoveFromCollectionAsync(Guid collectionId, string userId, string artworkId)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
                .ThenInclude(i => i.Artwork)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result<CollectionDto>.NotFound("Collection not found");

        var artworkIdGuid = Guid.Parse(artworkId);
        var item = collection.Items.FirstOrDefault(i => i.ArtworkId == artworkIdGuid);
        if (item == null)
            return Result<CollectionDto>.Failure("Artwork not in collection");

        _context.CollectionItems.Remove(item);
        await _context.SaveChangesAsync();

        var newCover = collection.Items.FirstOrDefault(i => i.Id != item.Id);
        collection.CoverImageUrl = newCover?.Artwork?.ImageUrl;
        await _context.SaveChangesAsync();

        return Result<CollectionDto>.Success(MapToDto(collection));
    }

    public async Task<Result> ReorderCollectionAsync(Guid collectionId, string userId, ReorderCollectionRequest request)
    {
        var collection = await _context.Collections
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Result.NotFound("Collection not found");

        for (int i = 0; i < request.ItemIds.Count; i++)
        {
            var item = collection.Items.FirstOrDefault(ci => ci.Id == request.ItemIds[i]);
            if (item != null)
                item.Order = i;
        }

        await _context.SaveChangesAsync();
        return Result.Success();
    }

      private static CollectionDto MapToDto(Collection collection)
    {
        var items = collection.Items
            .OrderBy(i => i.Order)
            .Select(item => new CollectionItemDto
            {
                Id = item.Id,
                ArtworkId = item.ArtworkId.ToString(),
                Title = item.Artwork?.Title ?? "Unknown",
                ImageUrl = item.Artwork?.ImageUrl ?? "",
                ArtistName = item.Artwork?.Artist?.DisplayName ?? "Unknown Artist",
                AddedAt = item.AddedAt
            }).ToList();

        return new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            IsPublic = collection.IsPublic,
            CoverImageUrl = collection.CoverImageUrl,
            ItemCount = items.Count,
            CreatedAt = collection.CreatedAt,
            Items = items
        };
    }
}