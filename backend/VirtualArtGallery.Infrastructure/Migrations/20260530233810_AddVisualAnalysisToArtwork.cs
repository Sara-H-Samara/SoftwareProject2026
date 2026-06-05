using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVisualAnalysisToArtwork : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorMood",
                table: "Artworks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DominantColors",
                table: "Artworks",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVisuallyAnalyzed",
                table: "Artworks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Mood",
                table: "Artworks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "Artworks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualStyle",
                table: "Artworks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorMood",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "DominantColors",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "IsVisuallyAnalyzed",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "Mood",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "VisualStyle",
                table: "Artworks");
        }
    }
}
