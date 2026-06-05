using System;
using System.Collections.Generic;

namespace VirtualArtGallery.Core.Entities;

public class Collection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public string? CoverImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public ApplicationUser? User { get; set; }
    public ICollection<CollectionItem> Items { get; set; } = new List<CollectionItem>();
}