# EF Core Migrations

This folder contains all Entity Framework Core database migrations.

## Creating the Initial Migration

From the solution root, run:

```bash
dotnet ef migrations add InitialCreate \
  --project VirtualArtGallery.Infrastructure \
  --startup-project VirtualArtGallery.Api \
  --output-dir Data/Migrations
```

## Applying Migrations

**Option 1 – CLI (recommended for CI/CD):**
```bash
dotnet ef database update \
  --project VirtualArtGallery.Infrastructure \
  --startup-project VirtualArtGallery.Api
```

**Option 2 – Auto-apply on startup (Development only):**
Already configured in `Program.cs` via `db.Database.MigrateAsync()`.

## Reverting a Migration

```bash
# Revert to the previous migration
dotnet ef database update PreviousMigrationName \
  --project VirtualArtGallery.Infrastructure \
  --startup-project VirtualArtGallery.Api

# Remove the last unapplied migration from the project
dotnet ef migrations remove \
  --project VirtualArtGallery.Infrastructure \
  --startup-project VirtualArtGallery.Api
```

## Tables Created by InitialCreate

| Table                     | Source                         |
|---------------------------|--------------------------------|
| AspNetUsers               | ApplicationUser (Identity)     |
| AspNetRoles               | IdentityRole                   |
| AspNetUserRoles           | Identity junction              |
| AspNetUserClaims          | Identity claims                |
| AspNetUserTokens          | Refresh + confirmation tokens  |
| Artworks                  | Artwork entity                 |
