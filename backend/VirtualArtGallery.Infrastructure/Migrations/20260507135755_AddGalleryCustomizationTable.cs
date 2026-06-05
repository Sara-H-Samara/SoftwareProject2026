using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGalleryCustomizationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GalleryCustomizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtistId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StructureJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WallsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FloorJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LightingJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FurnitureJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WallDecorationsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnvironmentJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsPremium = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryCustomizations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GalleryCustomizations_AspNetUsers_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GalleryCustomizations_ArtistId",
                table: "GalleryCustomizations",
                column: "ArtistId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GalleryCustomizations");
        }
    }
}
