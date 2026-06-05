// Application/Services/GalleryCustomizationService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.GalleryCustomization;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class GalleryCustomizationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<GalleryCustomizationService> _logger;

    public GalleryCustomizationService(
        ApplicationDbContext context,
        ILogger<GalleryCustomizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get customization for an artist - creates default if not exists
    /// </summary>
    public async Task<Result<GalleryCustomizationDto>> GetCustomizationAsync(string artistId)
    {
        try
        {
            var customization = await _context.Set<GalleryCustomization>()
                .FirstOrDefaultAsync(c => c.ArtistId == artistId);

            if (customization == null)
            {
                _logger.LogInformation("No customization found for artist {ArtistId}, returning default", artistId);
                return Result<GalleryCustomizationDto>.Success(GetDefaultCustomization());
            }

            var dto = new GalleryCustomizationDto
            {
                Structure   = JsonSerializer.Deserialize<StructureDto>(customization.StructureJson)       ?? new StructureDto(),
                Walls       = JsonSerializer.Deserialize<WallsDto>(customization.WallsJson)               ?? new WallsDto(),
                Floor       = JsonSerializer.Deserialize<FloorDto>(customization.FloorJson)               ?? new FloorDto(),
                Lighting    = JsonSerializer.Deserialize<LightingDto>(customization.LightingJson)         ?? new LightingDto(),
                Furniture   = JsonSerializer.Deserialize<List<FurnitureItemDto>>(customization.FurnitureJson) ?? new List<FurnitureItemDto>(),
                Environment = JsonSerializer.Deserialize<EnvironmentDto>(customization.EnvironmentJson)   ?? new EnvironmentDto(),
                UpdatedAt   = customization.UpdatedAt,
                IsPremium   = customization.IsPremium
            };

            // Shape is stored in a separate column — inject it into Structure
            if (!string.IsNullOrEmpty(customization.Shape))
                dto.Structure.Shape = customization.Shape;

            return Result<GalleryCustomizationDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customization for artist {ArtistId}", artistId);
            return Result<GalleryCustomizationDto>.Failure($"Failed to get customization: {ex.Message}");
        }
    }

    /// <summary>
    /// Save customization for an artist
    /// </summary>
    public async Task<Result<GalleryCustomizationDto>> SaveCustomizationAsync(string artistId, GalleryCustomizationDto dto)
    {
        try
        {
            var existing = await _context.Set<GalleryCustomization>()
                .FirstOrDefaultAsync(c => c.ArtistId == artistId);

            if (existing == null)
            {
                existing = new GalleryCustomization { ArtistId = artistId };
                _context.Set<GalleryCustomization>().Add(existing);
            }

            existing.StructureJson  = JsonSerializer.Serialize(dto.Structure);
            existing.WallsJson      = JsonSerializer.Serialize(dto.Walls);
            existing.FloorJson      = JsonSerializer.Serialize(dto.Floor);
            existing.LightingJson   = JsonSerializer.Serialize(dto.Lighting);
            existing.FurnitureJson  = JsonSerializer.Serialize(dto.Furniture);
            existing.EnvironmentJson = JsonSerializer.Serialize(dto.Environment);
            existing.UpdatedAt      = DateTime.UtcNow;
            existing.IsPremium      = dto.IsPremium;

            existing.Shape = dto.Structure?.Shape ?? "rectangle";

            await _context.SaveChangesAsync();

            _logger.LogInformation("Customization saved for artist {ArtistId}", artistId);

            return Result<GalleryCustomizationDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving customization for artist {ArtistId}", artistId);
            return Result<GalleryCustomizationDto>.Failure($"Failed to save customization: {ex.Message}");
        }
    }

    /// <summary>
    /// Reset customization to default
    /// </summary>
    public async Task<Result> ResetCustomizationAsync(string artistId)
    {
        try
        {
            var existing = await _context.Set<GalleryCustomization>()
                .FirstOrDefaultAsync(c => c.ArtistId == artistId);

            if (existing == null)
                return Result.NotFound("No customization found to reset");

            _context.Set<GalleryCustomization>().Remove(existing);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customization reset for artist {ArtistId}", artistId);

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting customization for artist {ArtistId}", artistId);
            return Result.Failure($"Failed to reset customization: {ex.Message}");
        }
    }

    /// <summary>
    /// Get default customization values
    /// </summary>
    private GalleryCustomizationDto GetDefaultCustomization()
    {
        return new GalleryCustomizationDto
        {
            Structure = new StructureDto
            {
                LayoutType  = "single_room",
                WallHeight  = 4.8f,
                RoomWidth   = 22f,
                RoomDepth   = 22f,
                CeilingType = "flat",
                Pillars     = false,
                Shape       = "rectangle"
            },
            Walls = new WallsDto
            {
                Material    = "plaster",
                Color       = "#ece6dc",
                Roughness   = 0.7f,
                Metalness   = 0f,
                Wainscoting = new WainscotingDto { Enabled = false },
                AccentWall  = new AccentWallDto  { Enabled = false },
                Moldings    = new MoldingsDto    { Enabled = false }
            },
            Floor = new FloorDto
            {
                Material  = "hardwood",
                Color     = "#231b0f",
                Gloss     = 0.1f,
                Roughness = 0.5f,
                Rug       = new RugDto { Enabled = false }
            },
            Lighting = new LightingDto
            {
                AmbientLight   = new AmbientLightDto  { Intensity = 0.75f, Color = "#fff4e6" },
                MainLighting   = new MainLightingDto  { Type = "chandelier", Intensity = 0.85f, ColorTemp = "warm" },
                Spotlights     = new SpotlightsDto    { Enabled = true, Count = 8, Intensity = 1.2f },
                Windows        = new WindowsDto       { Enabled = true, Count = 4, Size = "medium", Direction = "all", TimeOfDay = "afternoon" },
                AccentLighting = new AccentLightingDto { Enabled = false }
            },
            Furniture   = new List<FurnitureItemDto>(),
            Environment = new EnvironmentDto
            {
                OutsideView     = "city",
                Weather         = "clear",
                ParticleEffects = new ParticleEffectsDto { Enabled = false },
                AudioAmbience   = new AudioAmbienceDto   { Enabled = false },
                Fog             = new FogDto             { Enabled = false }
            },
            UpdatedAt = DateTime.UtcNow,
            IsPremium = false
        };
    }
}