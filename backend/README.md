# VirtualArtGallery — Backend API

ASP.NET Core 8 Web API built with Clean Architecture principles.

---

## Architecture Overview

```
VirtualArtGallery/
├── VirtualArtGallery.Core/           # Domain layer — no dependencies
│   ├── Entities/                     # ApplicationUser, Artwork
│   ├── Enums/                        # UserType, ArtworkType
│   ├── Interfaces/                   # IEmailService, ICloudStorageService, IAzureOpenAIService
│   └── Constants/                    # AppConstants
│
├── VirtualArtGallery.Infrastructure/ # External concerns — implements Core interfaces
│   ├── Data/                         # ApplicationDbContext, EF Migrations
│   ├── Services/                     # AzureBlobStorageService, EmailService, AzureOpenAIService
│   └── Configurations/               # Settings POCOs (JwtSettings, etc.)
│
├── VirtualArtGallery.Application/    # Business logic — orchestrates Core + Infrastructure
│   ├── Common/                       # Result<T> wrapper
│   ├── DTOs/                         # Auth, Artworks, Galleries, AI DTOs
│   ├── Services/                     # AuthService, ArtworkService, GalleryService, AiService
│   └── Validators/                   # FluentValidation validators
│
└── VirtualArtGallery.Api/            # Presentation layer — HTTP entry point
    ├── Controllers/                  # AuthController, ArtworksController, GalleriesController, AiController
    ├── Middleware/                   # GlobalExceptionMiddleware
    ├── Program.cs                    # DI + middleware pipeline
    └── appsettings.json              # Configuration
```

**Dependency flow:** `Api → Application → Infrastructure → Core`
Core has zero dependencies on outer layers.

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) or LocalDB (included with Visual Studio)
- [Azure Storage Account](https://azure.microsoft.com/en-us/products/storage/blobs) (or Azurite for local dev)
- Azure OpenAI resource (optional — AI features degrade gracefully)

---

## Quick Start

### 1. Clone and restore

```bash
git clone <repo-url>
cd VirtualArtGallery
dotnet restore
```

### 2. Configure secrets

Copy `VirtualArtGallery.Api/appsettings.Development.json` and fill in:
- `ConnectionStrings:DefaultConnection` — your SQL Server connection string
- `JwtSettings:Secret` — a random string of at least 32 characters
- `CloudStorageSettings:ConnectionString` — Azure Storage or `UseDevelopmentStorage=true`
- `OpenAISettings:ApiKey` and `Endpoint` — from your Azure OpenAI resource

> **Tip:** Use `dotnet user-secrets` to avoid storing keys in files:
> ```bash
> cd VirtualArtGallery.Api
> dotnet user-secrets set "JwtSettings:Secret" "your-super-secret-key-here"
> dotnet user-secrets set "OpenAISettings:ApiKey" "your-openai-key"
> ```

### 3. Run database migrations

```bash
dotnet ef migrations add InitialCreate \
  --project VirtualArtGallery.Infrastructure \
  --startup-project VirtualArtGallery.Api \
  --output-dir Data/Migrations

dotnet ef database update \
  --project VirtualArtGallery.Infrastructure \
  --startup-project VirtualArtGallery.Api
```

> In Development, migrations also auto-apply on startup via `Program.cs`.

### 4. Start the API

```bash
cd VirtualArtGallery.Api
dotnet run
```

API available at: `https://localhost:5001`
Swagger UI at: `https://localhost:5001/swagger`
Health check: `https://localhost:5001/health`

---

## Key Endpoints

| Method | Route                              | Auth         | Description                        |
|--------|------------------------------------|--------------|------------------------------------|
| POST   | /api/auth/register                 | Public       | Create account                     |
| POST   | /api/auth/login                    | Public       | Login → JWT + refresh token        |
| POST   | /api/auth/refresh-token            | Public       | Rotate tokens                      |
| GET    | /api/auth/profile                  | JWT          | Get own profile                    |
| PUT    | /api/auth/profile                  | JWT          | Update profile                     |
| POST   | /api/auth/profile/picture          | JWT          | Upload profile picture             |
| GET    | /api/artworks/my                   | Artist       | List own artworks                  |
| POST   | /api/artworks                      | Artist       | Create artwork + upload image      |
| PUT    | /api/artworks/{id}                 | Artist       | Update artwork metadata            |
| POST   | /api/artworks/positions            | Artist       | Bulk-save 3D layout positions      |
| DELETE | /api/artworks/{id}                 | Artist       | Delete artwork                     |
| GET    | /api/galleries                     | Public       | Browse all galleries               |
| GET    | /api/galleries/search?q=...        | Public       | Search galleries                   |
| GET    | /api/galleries/{artistId}          | Public       | Single artist gallery info         |
| GET    | /api/galleries/{artistId}/artworks | Public       | 3D scene artworks payload          |
| POST   | /api/ai/describe-artwork           | JWT          | AI artwork description             |
| POST   | /api/ai/inspire                    | JWT          | AI creative inspiration            |

---

## Testing

```bash
# Run all tests (once test projects are added under tests/)
dotnet test

# Suggested test project structure:
# tests/VirtualArtGallery.Application.Tests/  — unit tests for Services
# tests/VirtualArtGallery.Api.Tests/          — integration tests for Controllers
```

---

## Azure Blob Storage Setup

1. Create a Storage Account in the Azure Portal
2. Create two containers:
   - `artwork-images` — set Access Level to **Blob** (public read)
   - `profile-pictures` — set Access Level to **Blob** (public read)
3. Copy the connection string to `CloudStorageSettings:ConnectionString`

For local development, install [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite):
```bash
npm install -g azurite
azurite --silent --location ./azurite-data
```

---

## Docker (optional)

```dockerfile
# Dockerfile example — place in solution root
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish VirtualArtGallery.Api/VirtualArtGallery.Api.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VirtualArtGallery.Api.dll"]
```
