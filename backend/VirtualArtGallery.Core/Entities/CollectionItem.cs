using System;

namespace VirtualArtGallery.Core.Entities;

public class CollectionItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CollectionId { get; set; }
    public Guid ArtworkId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public int Order { get; set; }
    
    public Collection? Collection { get; set; }
    public Artwork? Artwork { get; set; }
}