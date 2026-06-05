using System;

namespace VirtualArtGallery.Core.Entities.Features;

public class ArtworkOfTheDay
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ArtworkId { get; set; }  
    public DateTime Date { get; set; }
    public int VotesCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Artwork? Artwork { get; set; }
}