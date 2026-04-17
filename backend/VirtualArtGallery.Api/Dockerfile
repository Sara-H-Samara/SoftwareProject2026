# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + project files first for layer-cached restore
COPY VirtualArtGallery.sln .
COPY VirtualArtGallery.Core/VirtualArtGallery.Core.csproj             VirtualArtGallery.Core/
COPY VirtualArtGallery.Infrastructure/VirtualArtGallery.Infrastructure.csproj VirtualArtGallery.Infrastructure/
COPY VirtualArtGallery.Application/VirtualArtGallery.Application.csproj       VirtualArtGallery.Application/
COPY VirtualArtGallery.Api/VirtualArtGallery.Api.csproj               VirtualArtGallery.Api/

RUN dotnet restore

# Copy all source
COPY . .

# Publish release build
RUN dotnet publish VirtualArtGallery.Api/VirtualArtGallery.Api.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 appgroup \
 && adduser  --system --uid 1001 --ingroup appgroup appuser
USER appuser

COPY --from=build --chown=appuser:appgroup /app/publish .

EXPOSE 80
ENTRYPOINT ["dotnet", "VirtualArtGallery.Api.dll"]
