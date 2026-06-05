using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredRoomStyle",
                table: "AspNetUsers");

            migrationBuilder.CreateTable(
                name: "UserAvatars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CustomizationJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvatarName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAvatars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAvatars_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActiveSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConnectionId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GalleryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AvatarId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PositionX = table.Column<float>(type: "real", nullable: false),
                    PositionZ = table.Column<float>(type: "real", nullable: false),
                    Rotation = table.Column<float>(type: "real", nullable: false),
                    CurrentAnimation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ViewingArtworkId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastHeartbeat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActiveSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActiveSessions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActiveSessions_UserAvatars_AvatarId",
                        column: x => x.AvatarId,
                        principalTable: "UserAvatars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveSessions_AvatarId",
                table: "ActiveSessions",
                column: "AvatarId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveSessions_ConnectionId",
                table: "ActiveSessions",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveSessions_GalleryId",
                table: "ActiveSessions",
                column: "GalleryId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveSessions_LastHeartbeat",
                table: "ActiveSessions",
                column: "LastHeartbeat");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveSessions_UserId",
                table: "ActiveSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAvatars_UserId",
                table: "UserAvatars",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActiveSessions");

            migrationBuilder.DropTable(
                name: "UserAvatars");

            migrationBuilder.AddColumn<int>(
                name: "PreferredRoomStyle",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
