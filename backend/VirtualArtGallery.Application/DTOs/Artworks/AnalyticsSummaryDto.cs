namespace VirtualArtGallery.Application.DTOs.Artworks;

public class AnalyticsSummaryDto
{
    public int TotalArtworks { get; set; }
    public int TotalLikes { get; set; }
    public int TotalReviews { get; set; }
    public int TotalFollowers { get; set; }
    public double AverageRating { get; set; }
    public decimal TotalSales { get; set; }
    public int TotalOrders { get; set; }
}