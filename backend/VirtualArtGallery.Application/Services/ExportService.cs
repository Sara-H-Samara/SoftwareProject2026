using System.Text;
using VirtualArtGallery.Application.DTOs.Analytics;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace VirtualArtGallery.Application.Services;

public class ExportService
{
    public ExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public string GenerateAnalyticsCSV(AnalyticsSummaryDto summary, List<SalesDataDto> sales, List<InteractionsDataDto> interactions, int months)
    {
        var csv = new StringBuilder();
        
        // Header
        csv.AppendLine("Virtual Art Gallery - Analytics Report");
        csv.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm}");
        csv.AppendLine($"Period: Last {months} months");
        csv.AppendLine();
        
        // Summary Section
        csv.AppendLine("SUMMARY");
        csv.AppendLine("Metric,Value");
        csv.AppendLine($"Total Artworks,{summary.TotalArtworks}");
        csv.AppendLine($"Total Likes,{summary.TotalLikes}");
        csv.AppendLine($"Total Reviews,{summary.TotalReviews}");
        csv.AppendLine($"Total Followers,{summary.TotalFollowers}");
        csv.AppendLine($"Average Rating,{summary.AverageRating:F1}");
        csv.AppendLine($"Total Sales,${summary.TotalSales:F2}");
        csv.AppendLine($"Total Orders,{summary.TotalOrders}");
        csv.AppendLine();
        
        // Sales Data Section
        csv.AppendLine("SALES DATA");
        csv.AppendLine("Month,Total Sales");
        foreach (var sale in sales)
        {
            csv.AppendLine($"{sale.Month},${sale.Total:F2}");
        }
        csv.AppendLine();
        
        // Interactions Data Section
        csv.AppendLine("INTERACTIONS DATA");
        csv.AppendLine("Month,Likes,Comments,Views");
        foreach (var interaction in interactions)
        {
            csv.AppendLine($"{interaction.Month},{interaction.Likes},{interaction.Comments},{interaction.Views}");
        }
        
        return csv.ToString();
    }

    public byte[] GenerateAnalyticsPDF(AnalyticsSummaryDto summary, List<SalesDataDto> sales, List<InteractionsDataDto> interactions, int months)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header()
                    .Element(ComposeHeader);

                page.Content()
                    .Element(x => ComposeContent(x, summary, sales, interactions, months));

                page.Footer()
                    .AlignCenter()
                    .Text(text =>
                    {
                        text.Span("Virtual Art Gallery - ");
                        text.CurrentPageNumber();
                        text.Span(" / ");
                        text.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Analytics Report")
                    .FontSize(20)
                    .Bold()
                    .FontColor(Colors.Blue.Darken2);

                column.Item().Text("Virtual Art Gallery")
                    .FontSize(12)
                    .FontColor(Colors.Grey.Darken1);
            });

            row.RelativeItem().AlignRight().Column(column =>
            {
                column.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm}")
                    .FontSize(10);
            });
        });
    }

    private void ComposeContent(IContainer container, AnalyticsSummaryDto summary, List<SalesDataDto> sales, List<InteractionsDataDto> interactions, int months)
    {
        container.Column(column =>
        {
            column.Item().Text($"Period: Last {months} months")
                .FontSize(12)
                .Bold();

            column.Item().PaddingVertical(10);

            // Summary Cards
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(summaryCol =>
                {
                    summaryCol.Item().Border(1).Padding(10).Column(c =>
                    {
                        c.Item().Text("Total Artworks").FontSize(10).FontColor(Colors.Grey.Medium);
                        c.Item().Text(summary.TotalArtworks.ToString()).FontSize(18).Bold();
                    });
                });
                row.RelativeItem().Column(summaryCol =>
                {
                    summaryCol.Item().Border(1).Padding(10).Column(c =>
                    {
                        c.Item().Text("Total Likes").FontSize(10).FontColor(Colors.Grey.Medium);
                        c.Item().Text(summary.TotalLikes.ToString()).FontSize(18).Bold();
                    });
                });
                row.RelativeItem().Column(summaryCol =>
                {
                    summaryCol.Item().Border(1).Padding(10).Column(c =>
                    {
                        c.Item().Text("Total Followers").FontSize(10).FontColor(Colors.Grey.Medium);
                        c.Item().Text(summary.TotalFollowers.ToString()).FontSize(18).Bold();
                    });
                });
                row.RelativeItem().Column(summaryCol =>
                {
                    summaryCol.Item().Border(1).Padding(10).Column(c =>
                    {
                        c.Item().Text("Total Sales").FontSize(10).FontColor(Colors.Grey.Medium);
                        c.Item().Text($"${summary.TotalSales:F2}").FontSize(18).Bold();
                    });
                });
            });

            column.Item().PaddingVertical(15);

            // Sales Chart Data
            column.Item().Text("Sales Overview")
                .FontSize(14)
                .Bold();
            
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Text("Month").Bold();
                    header.Cell().Text("Total Sales").Bold().AlignRight();
                });

                foreach (var sale in sales)
                {
                    table.Cell().Text(sale.Month);
                    table.Cell().Text($"${sale.Total:F2}").AlignRight();
                }
            });

            column.Item().PaddingVertical(15);

            // Interactions Data
            column.Item().Text("Engagement Overview")
                .FontSize(14)
                .Bold();

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Text("Month").Bold();
                    header.Cell().Text("Likes").Bold().AlignRight();
                    header.Cell().Text("Comments").Bold().AlignRight();
                    header.Cell().Text("Views").Bold().AlignRight();
                });

                foreach (var interaction in interactions)
                {
                    table.Cell().Text(interaction.Month);
                    table.Cell().Text(interaction.Likes.ToString()).AlignRight();
                    table.Cell().Text(interaction.Comments.ToString()).AlignRight();
                    table.Cell().Text(interaction.Views.ToString()).AlignRight();
                }
            });
        });
    }
}