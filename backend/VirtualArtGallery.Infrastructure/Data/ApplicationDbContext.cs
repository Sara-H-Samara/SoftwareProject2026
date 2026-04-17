using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Core.Entities;

namespace VirtualArtGallery.Infrastructure.Data;

/// <summary>
/// The main EF Core DbContext. Extends IdentityDbContext so that all ASP.NET Core Identity
/// tables (Users, Roles, Claims, Tokens…) are managed alongside our custom entities.
/// </summary>
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Artwork> Artworks => Set<Artwork>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder); // Must call base for Identity tables

        // ── Artwork Configuration ──────────────────────────────────────────────
        builder.Entity<Artwork>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Title)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(a => a.Description)
                  .HasMaxLength(2000);

            entity.Property(a => a.ImageUrl)
                  .IsRequired()
                  .HasMaxLength(500);

            entity.Property(a => a.Price)
                  .HasColumnType("decimal(18,2)");

            // Relationship: One Artist → Many Artworks
            entity.HasOne(a => a.Artist)
                  .WithMany(u => u.Artworks)
                  .HasForeignKey(a => a.ArtistId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index for fast filtering by artist
            entity.HasIndex(a => a.ArtistId);
            entity.HasIndex(a => a.IsPublished);
        });

        // ── ApplicationUser Configuration ─────────────────────────────────────
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.GalleryName).HasMaxLength(150);
            entity.Property(u => u.Bio).HasMaxLength(1000);
            entity.Property(u => u.DisplayName).HasMaxLength(100);
            entity.Property(u => u.ProfilePicUrl).HasMaxLength(500);
            entity.Property(u => u.RefreshToken).HasMaxLength(500);
        });
    }
}
