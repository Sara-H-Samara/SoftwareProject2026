using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualArtGallery.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveAuctionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BidEndsAt",
                table: "LiveSessions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "BiddingOpen",
                table: "LiveSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "FeaturedArtworkId",
                table: "LiveSessions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InviteCode",
                table: "LiveSessions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPrivate",
                table: "LiveSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "StartingBid",
                table: "LiveSessions",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BidEndsAt",
                table: "LiveSessions");

            migrationBuilder.DropColumn(
                name: "BiddingOpen",
                table: "LiveSessions");

            migrationBuilder.DropColumn(
                name: "FeaturedArtworkId",
                table: "LiveSessions");

            migrationBuilder.DropColumn(
                name: "InviteCode",
                table: "LiveSessions");

            migrationBuilder.DropColumn(
                name: "IsPrivate",
                table: "LiveSessions");

            migrationBuilder.DropColumn(
                name: "StartingBid",
                table: "LiveSessions");
        }
    }
}
