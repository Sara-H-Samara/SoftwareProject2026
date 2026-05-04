using System;
using System.Collections.Generic;

namespace VirtualArtGallery.Application.DTOs.Collections;

public record CreateCollectionRequestDto(
    string Name,
    string? Description = null,
    bool IsPublic = true
);

public record UpdateCollectionRequestDto(
    string? Name = null,
    string? Description = null,
    bool? IsPublic = null
);

public record CollectionItemDto(
    Guid Id,
    Guid ArtworkId,
    string Title,
    string ImageUrl,
    string ArtistName,
    DateTime AddedAt
);

public record AddToCollectionRequestDto(Guid ArtworkId);
public record ReorderCollectionRequestDto(List<Guid> ItemIds);

public record CollectionDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsPublic,
    string? CoverImageUrl,
    int ItemCount,
    DateTime CreatedAt,
    List<CollectionItemDto> Items
);