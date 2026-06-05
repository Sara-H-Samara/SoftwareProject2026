using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LiveSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtistId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaxVisitors = table.Column<int>(type: "int", nullable: false),
                    CurrentVisitorCount = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveSessions_AspNetUsers_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LiveBids",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtworkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BidderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PlacedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsWinning = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveBids", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveBids_Artworks_ArtworkId",
                        column: x => x.ArtworkId,
                        principalTable: "Artworks",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LiveBids_AspNetUsers_BidderId",
                        column: x => x.BidderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LiveBids_LiveSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "LiveSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LiveReactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtworkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Emoji = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveReactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LiveReactions_LiveSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "LiveSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LiveBids_ArtworkId",
                table: "LiveBids",
                column: "ArtworkId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveBids_BidderId",
                table: "LiveBids",
                column: "BidderId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveBids_SessionId",
                table: "LiveBids",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveReactions_SessionId",
                table: "LiveReactions",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveReactions_UserId",
                table: "LiveReactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessions_ArtistId",
                table: "LiveSessions",
                column: "ArtistId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LiveBids");

            migrationBuilder.DropTable(
                name: "LiveReactions");

            migrationBuilder.DropTable(
                name: "LiveSessions");
        }
    }
}
