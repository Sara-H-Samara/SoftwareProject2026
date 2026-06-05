using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Avatars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SkinColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Height = table.Column<float>(type: "real", nullable: false),
                    HairStyle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HairColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShirtStyle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShirtColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PantsStyle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PantsColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShoesColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Accessory = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccessoryColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avatars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avatars_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avatars_UserId",
                table: "Avatars",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Avatars");
        }
    }
}
