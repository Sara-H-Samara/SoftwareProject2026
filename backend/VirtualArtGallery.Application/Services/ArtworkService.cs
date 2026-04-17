using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Core.Constants;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace VirtualArtGallery.Application.Services;

/// <summary>
/// Handles all artwork CRUD operations for the logged-in artist.
/// Image upload/deletion is delegated to ICloudStorageService.
/// 3D placement data is saved/retrieved as part of each artwork record.
/// </summary>
public class ArtworkService
{
    private readonly ApplicationDbContext _db;
    private readonly ICloudStorageService _storage;
    private readonly ILogger<ArtworkService> _logger;

    public ArtworkService(ApplicationDbContext db, ICloudStorageService storage, ILogger<ArtworkService> logger)
    {
        _db = db;
        _storage = storage;
        _logger = logger;
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    /// <summary>Returns all artworks owned by an artist (published + drafts).</summary>
    public async Task<Result<List<ArtworkDto>>> GetMyArtworksAsync(string artistId)
    {
        var artworks = await _db.Artworks
            .Where(a => a.ArtistId == artistId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Result<List<ArtworkDto>>.Success(artworks.Select(MapToDto).ToList());
    }

    /// <summary>Returns all PUBLISHED artworks for a specific artist (public gallery view).</summary>
    public async Task<Result<List<ArtworkDto>>> GetPublishedArtworksForArtistAsync(string artistId)
    {
        _logger.LogInformation("[ArtworkService] Fetching published artworks for artistId: {ArtistId}", artistId);
        
        var artworks = await _db.Artworks
            .Include(a => a.Artist)
            .Where(a => a.ArtistId == artistId && a.IsPublished)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();

        _logger.LogInformation("[ArtworkService] Found {Count} published artworks for artistId: {ArtistId}", artworks.Count, artistId);
        
        return Result<List<ArtworkDto>>.Success(artworks.Select(MapToDto).ToList());
    }

    /// <summary>Returns a single artwork by ID — accessible by owner or if published.</summary>
    public async Task<Result<ArtworkDto>> GetByIdAsync(Guid id, string? requestingUserId)
    {
        var artwork = await _db.Artworks
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)
            return Result<ArtworkDto>.NotFound("Artwork not found.");

        // Only owner can see unpublished artworks
        if (!artwork.IsPublished && artwork.ArtistId != requestingUserId)
            return Result<ArtworkDto>.Forbidden("This artwork is not published.");

        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new artwork record. The image file is uploaded first, then
    /// the resulting URL is stored with the metadata.
    /// </summary>
    public async Task<Result<ArtworkDto>> CreateAsync(
        string artistId,
        CreateArtworkRequestDto dto,
        IFormFile imageFile)
    {
        // Validate file
        var fileValidation = ValidateImageFile(imageFile);
        if (!fileValidation.IsSuccess)
            return Result<ArtworkDto>.Failure(fileValidation.Error!);

        // Upload image to Azure Blob Storage
        string imageUrl;
        try
        {
            await using var stream = imageFile.OpenReadStream();
            imageUrl = await _storage.UploadFileAsync(
                stream,
                imageFile.FileName,
                imageFile.ContentType,
                AppConstants.BlobContainers.ArtworkImages);
        }
        catch (Exception ex)
        {
            return Result<ArtworkDto>.Failure($"Image upload failed: {ex.Message}");
        }

        _logger.LogInformation("[ArtworkService] Creating new artwork for artistId: {ArtistId}. Title: {Title}", artistId, dto.Title);
        
        var artwork = new Artwork
        {
            Title = dto.Title,
            Description = dto.Description,
            ImageUrl = imageUrl,
            ArtistId = artistId,
            Dimensions = dto.Dimensions,
            Materials = dto.Materials,
            Year = dto.Year,
            Price = dto.Price,
            ArtworkType = dto.ArtworkType,
            PositionX = dto.PositionX,
            PositionY = dto.PositionY,
            PositionZ = dto.PositionZ,
            RotationX = dto.RotationX,
            RotationY = dto.RotationY,
            RotationZ = dto.RotationZ,
            ScaleX = dto.ScaleX,
            ScaleY = dto.ScaleY,
            ScaleZ = dto.ScaleZ,
            IsPublished = dto.IsPublished, // Default is true in the DTO record definition
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Artworks.Add(artwork);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[ArtworkService] Successfully created artwork. Id: {ArtworkId}, IsPublished: {IsPublished}", artwork.Id, artwork.IsPublished);

        // Reload to include navigation (Artist name)
        await _db.Entry(artwork).Reference(a => a.Artist).LoadAsync();

        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    /// <summary>Partial update (PATCH). Only updates fields that are provided (non-null).</summary>
    public async Task<Result<ArtworkDto>> UpdateAsync(
        Guid id,
        string artistId,
        UpdateArtworkRequestDto dto)
    {
        var artwork = await _db.Artworks
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)
            return Result<ArtworkDto>.NotFound("Artwork not found.");

        if (artwork.ArtistId != artistId)
            return Result<ArtworkDto>.Forbidden("You do not own this artwork.");

        // Apply only the fields that were provided
        if (dto.Title != null) artwork.Title = dto.Title;
        if (dto.Description != null) artwork.Description = dto.Description;
        if (dto.Dimensions != null) artwork.Dimensions = dto.Dimensions;
        if (dto.Materials != null) artwork.Materials = dto.Materials;
        if (dto.Year.HasValue) artwork.Year = dto.Year;
        if (dto.Price.HasValue) artwork.Price = dto.Price;
        if (dto.ArtworkType.HasValue) artwork.ArtworkType = dto.ArtworkType.Value;
        if (dto.IsPublished.HasValue) artwork.IsPublished = dto.IsPublished.Value;

        // 3D placement data
        if (dto.PositionX.HasValue) artwork.PositionX = dto.PositionX.Value;
        if (dto.PositionY.HasValue) artwork.PositionY = dto.PositionY.Value;
        if (dto.PositionZ.HasValue) artwork.PositionZ = dto.PositionZ.Value;
        if (dto.RotationX.HasValue) artwork.RotationX = dto.RotationX.Value;
        if (dto.RotationY.HasValue) artwork.RotationY = dto.RotationY.Value;
        if (dto.RotationZ.HasValue) artwork.RotationZ = dto.RotationZ.Value;
        if (dto.ScaleX.HasValue) artwork.ScaleX = dto.ScaleX.Value;
        if (dto.ScaleY.HasValue) artwork.ScaleY = dto.ScaleY.Value;
        if (dto.ScaleZ.HasValue) artwork.ScaleZ = dto.ScaleZ.Value;

        artwork.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    /// <summary>
    /// Bulk-updates 3D positions for multiple artworks at once.
    /// Called by the Gallery Layout Editor when the artist saves their arrangement.
    /// </summary>
    public async Task<Result> BulkUpdatePositionsAsync(string artistId, List<UpdateArtworkPositionDto> positions)
    {
        var ids = positions.Select(p => p.ArtworkId).ToList();

        var artworks = await _db.Artworks
            .Where(a => ids.Contains(a.Id) && a.ArtistId == artistId)
            .ToListAsync();

        // Verify all artworks belong to this artist
        if (artworks.Count != positions.Count)
            return Result.Failure("One or more artworks not found or not owned by you.");

        foreach (var artwork in artworks)
        {
            var update = positions.First(p => p.ArtworkId == artwork.Id);
            artwork.PositionX = update.PositionX;
            artwork.PositionY = update.PositionY;
            artwork.PositionZ = update.PositionZ;
            artwork.RotationX = update.RotationX;
            artwork.RotationY = update.RotationY;
            artwork.RotationZ = update.RotationZ;
            artwork.ScaleX = update.ScaleX;
            artwork.ScaleY = update.ScaleY;
            artwork.ScaleZ = update.ScaleZ;
            artwork.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Result.Success();
    }

    /// <summary>Replaces the artwork's image file in Blob Storage.</summary>
    public async Task<Result<ArtworkDto>> UpdateImageAsync(Guid id, string artistId, IFormFile newImage)
    {
        var artwork = await _db.Artworks
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null) return Result<ArtworkDto>.NotFound("Artwork not found.");
        if (artwork.ArtistId != artistId) return Result<ArtworkDto>.Forbidden("You do not own this artwork.");

        var fileValidation = ValidateImageFile(newImage);
        if (!fileValidation.IsSuccess) return Result<ArtworkDto>.Failure(fileValidation.Error!);

        // Delete old image
        await _storage.DeleteFileAsync(artwork.ImageUrl, AppConstants.BlobContainers.ArtworkImages);

        // Upload replacement
        await using var stream = newImage.OpenReadStream();
        artwork.ImageUrl = await _storage.UploadFileAsync(
            stream, newImage.FileName, newImage.ContentType, AppConstants.BlobContainers.ArtworkImages);
        artwork.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public async Task<Result> DeleteAsync(Guid id, string artistId)
    {
        var artwork = await _db.Artworks.FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null) return Result.NotFound("Artwork not found.");
        if (artwork.ArtistId != artistId) return Result.Failure("You do not own this artwork.", 403);

        // Delete blob first to avoid orphaned files
        await _storage.DeleteFileAsync(artwork.ImageUrl, AppConstants.BlobContainers.ArtworkImages);

        _db.Artworks.Remove(artwork);
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    // ── Private Helpers ────────────────────────────────────────────────────────

    private static Result ValidateImageFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return Result.Failure("Image file is required.");

        if (file.Length > AppConstants.FileUpload.MaxFileSizeBytes)
            return Result.Failure($"File size exceeds the {AppConstants.FileUpload.MaxFileSizeBytes / 1024 / 1024}MB limit.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AppConstants.FileUpload.AllowedImageExtensions.Contains(extension))
            return Result.Failure($"Allowed file types: {string.Join(", ", AppConstants.FileUpload.AllowedImageExtensions)}");

        return Result.Success();
    }

    private static ArtworkDto MapToDto(Artwork a) => new(
        Id: a.Id,
        Title: a.Title,
        Description: a.Description,
        ImageUrl: a.ImageUrl,
        ArtistId: a.ArtistId,
        ArtistName: a.Artist?.DisplayName ?? a.Artist?.Email,
        Dimensions: a.Dimensions,
        Materials: a.Materials,
        Year: a.Year,
        Price: a.Price,
        ArtworkType: a.ArtworkType,
        IsPublished: a.IsPublished,
        PositionX: a.PositionX,
        PositionY: a.PositionY,
        PositionZ: a.PositionZ,
        RotationX: a.RotationX,
        RotationY: a.RotationY,
        RotationZ: a.RotationZ,
        ScaleX: a.ScaleX,
        ScaleY: a.ScaleY,
        ScaleZ: a.ScaleZ,
        CreatedAt: a.CreatedAt,
        UpdatedAt: a.UpdatedAt
    );
}
