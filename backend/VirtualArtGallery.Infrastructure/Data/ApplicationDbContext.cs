using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Entities.Features;

namespace VirtualArtGallery.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Artwork> Artworks { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Like> Likes { get; set; }
    public DbSet<Follow> Follows { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<UserBadge> UserBadges { get; set; }
    public DbSet<Collection> Collections { get; set; }
    public DbSet<CollectionItem> CollectionItems { get; set; }
    public DbSet<UserNotificationSettings> UserNotificationSettings { get; set; }
    public DbSet<ArtworkOfTheDay> ArtworksOfTheDay { get; set; }
    public DbSet<ArtworkVote> ArtworkVotes { get; set; }
    public DbSet<UserAvatar> UserAvatars { get; set; }
    public DbSet<ActiveSession> ActiveSessions { get; set; }
    public DbSet<GalleryCustomization> GalleryCustomizations { get; set; }
    public DbSet<LiveSession> LiveSessions { get; set; }
    public DbSet<LiveBid> LiveBids { get; set; }
    public DbSet<LiveReaction> LiveReactions { get; set; }
    public DbSet<Avatar> Avatars { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Fix decimal precision for Price
        modelBuilder.Entity<Artwork>(entity =>
        {
            entity.Property(a => a.Price)
                .HasPrecision(18, 2);
        });

        // CollectionItem configuration
        modelBuilder.Entity<CollectionItem>(entity =>
        {
            entity.HasKey(ci => ci.Id);

            entity.HasOne(ci => ci.Artwork)
                .WithMany()
                .HasForeignKey(ci => ci.ArtworkId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ci => ci.Collection)
                .WithMany(c => c.Items)
                .HasForeignKey(ci => ci.CollectionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(ci => ci.Order)
                .HasDefaultValue(0);
        });

        // Review configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.HasOne(r => r.Artwork)
                .WithMany(a => a.Reviews)
                .HasForeignKey(r => r.ArtworkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(r => new { r.ArtworkId, r.UserId })
                .IsUnique();
        });

        // Comment configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.Artwork)
                .WithMany(a => a.Comments)
                .HasForeignKey(c => c.ArtworkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Review)
                .WithMany(r => r.Comments)
                .HasForeignKey(c => c.ReviewId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Like configuration
        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.HasOne(l => l.Artwork)
                .WithMany(a => a.Likes)
                .HasForeignKey(l => l.ArtworkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(l => new { l.ArtworkId, l.UserId })
                .IsUnique();
        });

        // Follow configuration
        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasKey(f => f.Id);

            entity.HasOne(f => f.Follower)
                .WithMany()
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(f => f.Followed)
                .WithMany()
                .HasForeignKey(f => f.FollowedId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(f => new { f.FollowerId, f.FollowedId })
                .IsUnique();
        });

        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(o => o.TotalAmount).HasPrecision(18, 2);
            entity.HasIndex(o => o.UserId);
            entity.HasIndex(o => o.StripeSessionId);
        });

        // OrderItem configuration
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(o => o.Price).HasPrecision(18, 2);
            entity.HasIndex(o => o.OrderId);
            entity.HasIndex(o => o.ArtworkId);
        });

        // ArtworkVote configuration
        modelBuilder.Entity<ArtworkVote>(entity =>
        {
            entity.HasKey(v => v.Id);

            entity.HasOne(v => v.Artwork)
                .WithMany()
                .HasForeignKey(v => v.ArtworkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(v => new { v.ArtworkId, v.UserId })
                .IsUnique();
        });

        // ArtworkOfTheDay configuration
        modelBuilder.Entity<ArtworkOfTheDay>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.HasOne(a => a.Artwork)
                .WithMany()
                .HasForeignKey(a => a.ArtworkId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => a.Date).IsUnique();
        });

        // UserAvatar configuration
        modelBuilder.Entity<UserAvatar>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.CustomizationJson).IsRequired();

            entity.HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<UserAvatar>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ActiveSession configuration
        modelBuilder.Entity<ActiveSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ConnectionId);
            entity.HasIndex(e => e.GalleryId);
            entity.HasIndex(e => e.LastHeartbeat);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Avatar)
                .WithMany()
                .HasForeignKey(e => e.AvatarId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GalleryCustomization configuration
        modelBuilder.Entity<GalleryCustomization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ArtistId).IsUnique();
            entity.Property(e => e.StructureJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.WallsJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.FloorJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.LightingJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.FurnitureJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.EnvironmentJson).HasColumnType("nvarchar(max)");

            entity.HasOne(e => e.Artist)
                .WithMany()
                .HasForeignKey(e => e.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Live Feature configuration ─────────────────────────────────────────

        modelBuilder.Entity<LiveSession>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Artist)
                .WithMany()
                .HasForeignKey(e => e.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LiveBid>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity.HasOne(e => e.Session)
                .WithMany(s => s.Bids)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // NoAction to avoid multiple cascade paths
            entity.HasOne(e => e.Artwork)
                .WithMany()
                .HasForeignKey(e => e.ArtworkId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Bidder)
                .WithMany()
                .HasForeignKey(e => e.BidderId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<LiveReaction>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Session)
                .WithMany(s => s.Reactions)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // NoAction to avoid multiple cascade paths
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}