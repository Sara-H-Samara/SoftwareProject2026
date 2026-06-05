using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGalleryCustomizationTableV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WallDecorationsJson",
                table: "GalleryCustomizations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WallDecorationsJson",
                table: "GalleryCustomizations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
