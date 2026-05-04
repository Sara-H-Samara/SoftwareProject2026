namespace VirtualArtGallery.Application.DTOs.Users;

public class TopArtistDto
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? GalleryName { get; set; }
    public string? ProfilePicUrl { get; set; }
    public string? Bio { get; set; }
    public int ArtworkCount { get; set; }
    public int FollowerCount { get; set; }
    public double AverageRating { get; set; }
}