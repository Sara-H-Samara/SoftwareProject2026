using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Core.Entities;

namespace VirtualArtGallery.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Artwork> Artworks => Set<Artwork>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<CollectionItem> CollectionItems => Set<CollectionItem>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<UserNotificationSettings> UserNotificationSettings => Set<UserNotificationSettings>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── Artwork Configuration (unchanged) ──────────────────────────────
        builder.Entity<Artwork>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Title).IsRequired().HasMaxLength(200);
            entity.Property(a => a.Description).HasMaxLength(2000);
            entity.Property(a => a.ImageUrl).IsRequired().HasMaxLength(500);
            entity.Property(a => a.Price).HasColumnType("decimal(18,2)");
            entity.HasOne(a => a.Artist)
                  .WithMany(u => u.Artworks)
                  .HasForeignKey(a => a.ArtistId)
                  .OnDelete(DeleteBehavior.Cascade); // Safe: no conflicting paths
            entity.HasIndex(a => a.ArtistId);
            entity.HasIndex(a => a.IsPublished);
        });

        // ── ApplicationUser Configuration (unchanged) ─────────────────────
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.GalleryName).HasMaxLength(150);
            entity.Property(u => u.Bio).HasMaxLength(1000);
            entity.Property(u => u.DisplayName).HasMaxLength(100);
            entity.Property(u => u.ProfilePicUrl).HasMaxLength(500);
            entity.Property(u => u.RefreshToken).HasMaxLength(500);
        });

        // ── Activity ─────────────────────────────────────────────────────
        builder.Entity<Activity>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.UserId).IsRequired();
            entity.Property(a => a.Type).IsRequired().HasMaxLength(50);
            entity.Property(a => a.Message).IsRequired().HasMaxLength(500);
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed cascade path
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.CreatedAt);
        });

        // ── Collection ───────────────────────────────────────────────────
        builder.Entity<Collection>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.UserId).IsRequired();
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Description).HasMaxLength(1000);
            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed cascade path
            entity.HasIndex(c => c.UserId);
        });

        // ── CollectionItem ──────────────────────────────────────────────
        builder.Entity<CollectionItem>(entity =>
        {
            entity.HasKey(ci => ci.Id);
            entity.Property(ci => ci.CollectionId).IsRequired();
            entity.Property(ci => ci.ArtworkId).IsRequired();
            entity.HasOne(ci => ci.Collection)
                  .WithMany(c => c.Items)
                  .HasForeignKey(ci => ci.CollectionId)
                  .OnDelete(DeleteBehavior.Cascade); // Safe: owned by Collection
            entity.HasOne(ci => ci.Artwork)
                  .WithMany()
                  .HasForeignKey(ci => ci.ArtworkId)
                  .OnDelete(DeleteBehavior.Restrict); // Avoid cascade to Artwork
            entity.HasIndex(ci => ci.CollectionId);
        });

        // ── Comment ────────────────────────────────────────────────────
        builder.Entity<Comment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.UserId).IsRequired();
            entity.Property(c => c.Content).IsRequired().HasMaxLength(1000);
            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed cascade path
            entity.HasIndex(c => c.ArtworkId);
            entity.HasIndex(c => c.ReviewId);
            entity.HasIndex(c => c.ParentCommentId);
        });

        // ── Follow ─────────────────────────────────────────────────────
        builder.Entity<Follow>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.HasIndex(f => new { f.FollowerId, f.FollowedId }).IsUnique();
            entity.HasOne(f => f.Follower)
                  .WithMany()
                  .HasForeignKey(f => f.FollowerId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed
            entity.HasOne(f => f.Followed)
                  .WithMany()
                  .HasForeignKey(f => f.FollowedId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed
        });

        // ── Like ───────────────────────────────────────────────────────
        builder.Entity<Like>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => new { l.UserId, l.ArtworkId }).IsUnique();
            entity.HasOne(l => l.User)
                  .WithMany()
                  .HasForeignKey(l => l.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed multiple cascade paths
            entity.HasOne(l => l.Artwork)
                  .WithMany(a => a.Likes)
                  .HasForeignKey(l => l.ArtworkId)
                  .OnDelete(DeleteBehavior.Cascade); // Safe: Artwork cascade to Likes is fine
        });

        // ── Notification ───────────────────────────────────────────────
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.UserId).IsRequired();
            entity.Property(n => n.Type).IsRequired().HasMaxLength(50);
            entity.Property(n => n.Message).IsRequired().HasMaxLength(500);
            entity.HasOne(n => n.User)
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed cascade path
            entity.HasIndex(n => n.UserId);
            entity.HasIndex(n => n.IsRead);
            entity.HasIndex(n => n.CreatedAt);
        });

        // ── Order ──────────────────────────────────────────────────────
        builder.Entity<Order>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.UserId).IsRequired();
            entity.Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
            entity.HasOne(o => o.User)
                  .WithMany()
                  .HasForeignKey(o => o.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed cascade path
            entity.HasIndex(o => o.UserId);
            entity.HasIndex(o => o.Status);
        });

        // ── OrderItem ──────────────────────────────────────────────────
        builder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(oi => oi.Id);
            entity.Property(oi => oi.OrderId).IsRequired();
            entity.Property(oi => oi.ArtworkId).IsRequired();
            entity.Property(oi => oi.Price).HasColumnType("decimal(18,2)");
            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.Items)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade); // Safe: owned by Order
        });

        // ── Review ─────────────────────────────────────────────────────
        builder.Entity<Review>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.UserId).IsRequired();
            entity.Property(r => r.ArtworkId).IsRequired();
            entity.Property(r => r.Rating).IsRequired();
            entity.Property(r => r.Comment).HasMaxLength(2000);
            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed
            entity.HasOne(r => r.Artwork)
                  .WithMany(a => a.Reviews)
                  .HasForeignKey(r => r.ArtworkId)
                  .OnDelete(DeleteBehavior.Cascade); // Safe: Artwork owns Reviews
            entity.HasIndex(r => r.ArtworkId);
            entity.HasIndex(r => r.UserId);
        });

        // ── UserBadge ──────────────────────────────────────────────────
        builder.Entity<UserBadge>(entity =>
        {
            entity.HasKey(ub => ub.Id);
            entity.Property(ub => ub.UserId).IsRequired();
            entity.Property(ub => ub.BadgeType).IsRequired().HasMaxLength(100);
            entity.HasOne(ub => ub.User)
                  .WithMany()
                  .HasForeignKey(ub => ub.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed
            entity.HasIndex(ub => ub.UserId);
        });

        // ── UserNotificationSetting ────────────────────────────────────
        builder.Entity<UserNotificationSettings>(entity =>
        {
            entity.HasKey(uns => uns.Id);
            entity.Property(uns => uns.UserId).IsRequired();
            entity.HasOne(uns => uns.User)
                  .WithMany()
                  .HasForeignKey(uns => uns.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Fixed
            entity.HasIndex(uns => uns.UserId).IsUnique();
        });
    }
}