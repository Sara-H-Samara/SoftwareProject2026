
namespace VirtualArtGallery.Application.DTOs.Collections;

public class CollectionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public string? CoverImageUrl { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CollectionItemDto> Items { get; set; } = new();
}

public class CollectionItemDto
{
    public Guid Id { get; set; }
    public string ArtworkId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string ArtistName { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

public class CreateCollectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
}

public class UpdateCollectionRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
}

public class AddToCollectionRequest
{
    public string ArtworkId { get; set; } = string.Empty;
}

public class ReorderCollectionRequest
{
    public List<Guid> ItemIds { get; set; } = new();
}