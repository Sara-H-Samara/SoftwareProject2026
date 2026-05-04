namespace VirtualArtGallery.Application.DTOs.Analytics;

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

public class SalesDataDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

public class InteractionsDataDto
{
    public string Month { get; set; } = string.Empty;
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Views { get; set; }
}