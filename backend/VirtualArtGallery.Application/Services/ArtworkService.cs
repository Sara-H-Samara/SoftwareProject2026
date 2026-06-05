// Application/Services/ArtworkService.cs
// التغييرات: أضف IAzureOpenAIService للـ constructor، وعدّل CreateAsync و MapToDto

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Analytics;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Core.Constants;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Enums;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class ArtworkService
{
    private readonly ApplicationDbContext  _db;
    private readonly ICloudStorageService  _storage;
    private readonly IAzureOpenAIService   _ai;       

    public ArtworkService(
        ApplicationDbContext  db,
        ICloudStorageService  storage,
        IAzureOpenAIService   ai)          
    {
        _db      = db;
        _storage = storage;
        _ai      = ai;
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    public async Task<Result<List<ArtworkDto>>> GetMyArtworksAsync(string artistId)
    {
        var artworks = await _db.Artworks
            .Where(a => a.ArtistId == artistId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
        return Result<List<ArtworkDto>>.Success(artworks.Select(MapToDto).ToList());
    }

    public async Task<Result<List<ArtworkDto>>> GetPublishedArtworksForArtistAsync(string artistId)
    {
        var artworks = await _db.Artworks
            .Include(a => a.Artist)
            .Where(a => a.ArtistId == artistId && a.IsPublished)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();
        return Result<List<ArtworkDto>>.Success(artworks.Select(MapToDto).ToList());
    }

    public async Task<Result<ArtworkDto>> GetByIdAsync(Guid id, string? requestingUserId)
    {
        var artwork = await _db.Artworks
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)
            return Result<ArtworkDto>.NotFound("Artwork not found.");

        if (!artwork.IsPublished && artwork.ArtistId != requestingUserId)
            return Result<ArtworkDto>.Forbidden("This artwork is not published.");

        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    public async Task<Result<ArtworkDto>> CreateAsync(
        string artistId,
        CreateArtworkRequestDto dto,
        IFormFile imageFile)
    {
        var fileValidation = ValidateImageFile(imageFile);
        if (!fileValidation.IsSuccess)
            return Result<ArtworkDto>.Failure(fileValidation.Error!);

        string imageUrl;
        try
        {
            await using var stream = imageFile.OpenReadStream();
            imageUrl = await _storage.UploadFileAsync(
                stream, imageFile.FileName, imageFile.ContentType,
                AppConstants.BlobContainers.ArtworkImages);
        }
        catch (Exception ex)
        {
            return Result<ArtworkDto>.Failure($"Image upload failed: {ex.Message}");
        }

        var artwork = new Artwork
        {
            Title       = dto.Title,
            Description = dto.Description,
            ImageUrl    = imageUrl,
            ArtistId    = artistId,
            Dimensions  = dto.Dimensions,
            Materials   = dto.Materials,
            Year        = dto.Year,
            Price       = dto.Price,
            ArtworkType = dto.ArtworkType,
            AudioUrl    = dto.AudioUrl,
            PositionX   = dto.PositionX,
            PositionY   = dto.PositionY,
            PositionZ   = dto.PositionZ,
            RotationX   = dto.RotationX,
            RotationY   = dto.RotationY,
            RotationZ   = dto.RotationZ,
            ScaleX      = dto.ScaleX,
            ScaleY      = dto.ScaleY,
            ScaleZ      = dto.ScaleZ,
            IsPublished = false,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow
        };

        _db.Artworks.Add(artwork);
        await _db.SaveChangesAsync();
        await _db.Entry(artwork).Reference(a => a.Artist).LoadAsync();

        // ── Visual analysis (fire-and-forget after save) ──────────────────────
        // Runs in background so the upload response is instant.
        // If it fails the artwork is still created; IsVisuallyAnalyzed stays false.
        _ = AnalyzeAndSaveVisualDataAsync(artwork.Id, imageUrl,
                dto.Title, dto.ArtworkType.ToString(), dto.Description);

        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    /// <summary>
    /// Called after upload. Analyzes the image with GPT-4 Vision and
    /// saves the visual properties back to the artwork record.
    /// </summary>
    private async Task AnalyzeAndSaveVisualDataAsync(
        Guid artworkId, string imageUrl,
        string title, string artworkType, string? description)
    {
        try
        {
            var analysis = await _ai.AnalyzeArtworkImageAsync(
                imageUrl, title, artworkType, description);

            var artwork = await _db.Artworks.FindAsync(artworkId);
            if (artwork == null) return;

            artwork.ColorMood          = analysis.ColorMood;
            artwork.VisualStyle        = analysis.VisualStyle;
            artwork.Subject            = analysis.Subject;
            artwork.Mood               = analysis.Mood;
            artwork.DominantColors     = analysis.DominantColors;
            artwork.IsVisuallyAnalyzed = true;
            artwork.UpdatedAt          = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }
        catch
        {
        }
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    public async Task<Result<ArtworkDto>> UpdateAsync(
        Guid id, string artistId, UpdateArtworkRequestDto dto)
    {
        var artwork = await _db.Artworks
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)      return Result<ArtworkDto>.NotFound("Artwork not found.");
        if (artwork.ArtistId != artistId) return Result<ArtworkDto>.Forbidden("You do not own this artwork.");

        if (dto.Title       != null) artwork.Title       = dto.Title;
        if (dto.Description != null) artwork.Description = dto.Description;
        if (dto.Dimensions  != null) artwork.Dimensions  = dto.Dimensions;
        if (dto.Materials   != null) artwork.Materials   = dto.Materials;
        if (dto.Year.HasValue)       artwork.Year        = dto.Year;
        if (dto.Price.HasValue)      artwork.Price       = dto.Price;
        if (dto.ArtworkType.HasValue) artwork.ArtworkType = dto.ArtworkType.Value;
        if (dto.IsPublished.HasValue) artwork.IsPublished = dto.IsPublished.Value;
        if (dto.AudioUrl    != null) artwork.AudioUrl    = dto.AudioUrl;

        if (dto.PositionX.HasValue) artwork.PositionX = dto.PositionX.Value;
        if (dto.PositionY.HasValue) artwork.PositionY = dto.PositionY.Value;
        if (dto.PositionZ.HasValue) artwork.PositionZ = dto.PositionZ.Value;
        if (dto.RotationX.HasValue) artwork.RotationX = dto.RotationX.Value;
        if (dto.RotationY.HasValue) artwork.RotationY = dto.RotationY.Value;
        if (dto.RotationZ.HasValue) artwork.RotationZ = dto.RotationZ.Value;
        if (dto.ScaleX.HasValue)    artwork.ScaleX    = dto.ScaleX.Value;
        if (dto.ScaleY.HasValue)    artwork.ScaleY    = dto.ScaleY.Value;
        if (dto.ScaleZ.HasValue)    artwork.ScaleZ    = dto.ScaleZ.Value;

        artwork.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync();
            return Result<ArtworkDto>.Success(MapToDto(artwork));
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var entry = ex.Entries.First();
            var dbValues = await entry.GetDatabaseValuesAsync();
            if (dbValues == null)
                return Result<ArtworkDto>.NotFound("Artwork was deleted by another user.");

            var dbArtwork = (Artwork)dbValues.ToObject();
            var conflicts = new List<string>();
            if (dbArtwork.Title      != artwork.Title)      conflicts.Add($"Title (was: '{dbArtwork.Title}')");
            if (dbArtwork.Price      != artwork.Price)      conflicts.Add($"Price (was: ${dbArtwork.Price})");
            if (dbArtwork.IsPublished!= artwork.IsPublished) conflicts.Add("Published status");

            return Result<ArtworkDto>.Failure(
                conflicts.Any()
                    ? $"Conflicts: {string.Join(", ", conflicts)}. Please refresh."
                    : "Modified by another user. Please refresh.",
                409);
        }
    }

    public async Task<Result> BulkUpdatePositionsAsync(
        string artistId, List<UpdateArtworkPositionDto> positions)
    {
        var ids      = positions.Select(p => p.ArtworkId).ToList();
        var artworks = await _db.Artworks
            .Where(a => ids.Contains(a.Id) && a.ArtistId == artistId)
            .ToListAsync();

        if (artworks.Count != positions.Count)
            return Result.Failure("One or more artworks not found or not owned by you.");

        foreach (var artwork in artworks)
        {
            var u = positions.First(p => p.ArtworkId == artwork.Id);
            artwork.PositionX = u.PositionX; artwork.PositionY = u.PositionY; artwork.PositionZ = u.PositionZ;
            artwork.RotationX = u.RotationX; artwork.RotationY = u.RotationY; artwork.RotationZ = u.RotationZ;
            artwork.ScaleX    = u.ScaleX;    artwork.ScaleY    = u.ScaleY;    artwork.ScaleZ    = u.ScaleZ;
            artwork.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<ArtworkDto>> UpdateImageAsync(
        Guid id, string artistId, IFormFile newImage)
    {
        var artwork = await _db.Artworks.Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork == null)           return Result<ArtworkDto>.NotFound("Artwork not found.");
        if (artwork.ArtistId != artistId) return Result<ArtworkDto>.Forbidden("You do not own this artwork.");

        var fileValidation = ValidateImageFile(newImage);
        if (!fileValidation.IsSuccess) return Result<ArtworkDto>.Failure(fileValidation.Error!);

        await _storage.DeleteFileAsync(artwork.ImageUrl, AppConstants.BlobContainers.ArtworkImages);

        await using var stream = newImage.OpenReadStream();
        artwork.ImageUrl  = await _storage.UploadFileAsync(
            stream, newImage.FileName, newImage.ContentType, AppConstants.BlobContainers.ArtworkImages);
        artwork.IsVisuallyAnalyzed = false;   
        artwork.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _ = AnalyzeAndSaveVisualDataAsync(artwork.Id, artwork.ImageUrl,
                artwork.Title, artwork.ArtworkType.ToString(), artwork.Description);

        return Result<ArtworkDto>.Success(MapToDto(artwork));
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public async Task<Result> DeleteAsync(Guid id, string artistId)
    {
        var artwork = await _db.Artworks.FirstOrDefaultAsync(a => a.Id == id);
        if (artwork == null)              return Result.NotFound("Artwork not found.");
        if (artwork.ArtistId != artistId) return Result.Failure("You do not own this artwork.", 403);

        _db.CollectionItems.RemoveRange(_db.CollectionItems.Where(ci => ci.ArtworkId == id));
        _db.Likes.RemoveRange(_db.Likes.Where(l => l.ArtworkId == id));
        _db.Reviews.RemoveRange(_db.Reviews.Where(r => r.ArtworkId == id));

        await _storage.DeleteFileAsync(artwork.ImageUrl, AppConstants.BlobContainers.ArtworkImages);
        _db.Artworks.Remove(artwork);
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    // ── Search ─────────────────────────────────────────────────────────────────

    public async Task<SearchResultDto<ArtworkDto>> SearchArtworksAsync(
        string? query, decimal? minPrice, decimal? maxPrice,
        ArtworkType? artworkType, string? sortBy, int page, int pageSize)
    {
        var q = _db.Artworks.Include(a => a.Artist).Include(a => a.Likes).Include(a => a.Reviews)
                            .Where(a => a.IsPublished);

        if (!string.IsNullOrEmpty(query))
            q = q.Where(a => a.Title.Contains(query) ||
                (a.Artist != null && a.Artist.DisplayName != null && a.Artist.DisplayName.Contains(query)));

        if (minPrice.HasValue) q = q.Where(a => a.Price >= minPrice.Value);
        if (maxPrice.HasValue) q = q.Where(a => a.Price <= maxPrice.Value);
        if (artworkType.HasValue) q = q.Where(a => a.ArtworkType == artworkType.Value);

        q = sortBy switch
        {
            "newest"     => q.OrderByDescending(a => a.CreatedAt),
            "oldest"     => q.OrderBy(a => a.CreatedAt),
            "price_asc"  => q.OrderBy(a => a.Price),
            "price_desc" => q.OrderByDescending(a => a.Price),
            "most_liked" => q.OrderByDescending(a => a.Likes.Count),
            "top_rated"  => q.OrderByDescending(a => a.Reviews.Any()
                                ? a.Reviews.Average(r => r.Rating) : 0.0),
            _ => q.OrderByDescending(a => a.CreatedAt)
        };

        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new SearchResultDto<ArtworkDto>
        {
            Items       = items.Select(MapToDto).ToList(),
            TotalCount  = total,
            Page        = page,
            PageSize    = pageSize,
            HasNextPage = page * pageSize < total,
            HasPrevPage = page > 1
        };
    }

    public async Task<string[]> GetSearchSuggestionsAsync(string query)
    {
        if (string.IsNullOrEmpty(query) || query.Length < 2)
            return Array.Empty<string>();

        var suggestions = new List<string>();
        suggestions.AddRange(await _db.Artworks.Where(a => a.IsPublished && a.Title.Contains(query))
            .Select(a => a.Title).Distinct().Take(5).ToListAsync());
        suggestions.AddRange(await _db.Users.Where(u => u.DisplayName != null && u.DisplayName.Contains(query))
            .Select(u => u.DisplayName!).Take(3).ToListAsync());

        return suggestions.Distinct().Take(8).ToArray();
    }

    // ── Analytics ──────────────────────────────────────────────────────────────

    public async Task<AnalyticsSummaryDto> GetAnalyticsSummaryAsync(string artistId)
    {
        var artworks = await _db.Artworks.Include(a => a.Likes).Include(a => a.Reviews)
            .Where(a => a.ArtistId == artistId).ToListAsync();

        var artworkIds  = artworks.Select(a => a.Id).ToList();
        var orders      = await _db.OrderItems.Include(oi => oi.Order)
            .Where(oi => artworkIds.Contains(oi.ArtworkId)).ToListAsync();

        return new AnalyticsSummaryDto
        {
            TotalArtworks  = artworks.Count,
            TotalLikes     = artworks.Sum(a => a.LikesCount),
            TotalReviews   = artworks.Sum(a => a.ReviewsCount),
            TotalFollowers = await _db.Follows.CountAsync(f => f.FollowedId == artistId),
            AverageRating  = Math.Round(artworks.Where(a => a.ReviewsCount > 0)
                                .Select(a => a.AverageRating).DefaultIfEmpty(0).Average(), 1),
            TotalSales     = orders.Sum(oi => oi.Price * oi.Quantity),
            TotalOrders    = orders.Select(oi => oi.OrderId).Distinct().Count(),
        };
    }

    public async Task<List<SalesDataDto>> GetSalesDataAsync(string artistId, int months)
    {
        var startDate  = DateTime.UtcNow.AddMonths(-months);
        var artworkIds = await _db.Artworks.Where(a => a.ArtistId == artistId).Select(a => a.Id).ToListAsync();
        var items      = await _db.OrderItems.Include(oi => oi.Order)
            .Where(oi => oi.Order != null && artworkIds.Contains(oi.ArtworkId) && oi.Order.CreatedAt >= startDate)
            .ToListAsync();

        return items.Where(oi => oi.Order != null)
            .GroupBy(oi => new { oi.Order!.CreatedAt.Year, oi.Order!.CreatedAt.Month })
            .Select(g => new SalesDataDto { Month = $"{g.Key.Year}-{g.Key.Month:D2}", Total = g.Sum(oi => oi.Price * oi.Quantity) })
            .OrderBy(d => d.Month).ToList();
    }

    public async Task<List<InteractionsDataDto>> GetInteractionsDataAsync(string artistId, int months)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months);
        var likes = await _db.Likes.Include(l => l.Artwork!)
            .Where(l => l.Artwork != null && l.Artwork.ArtistId == artistId && l.CreatedAt >= startDate)
            .ToListAsync();

        return likes.GroupBy(l => new { l.CreatedAt.Year, l.CreatedAt.Month })
            .Select(g => new InteractionsDataDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}", Likes = g.Count(), Comments = 0, Views = 0
            }).OrderBy(d => d.Month).ToList();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static Result ValidateImageFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return Result.Failure("Image file is required.");
        if (file.Length > AppConstants.FileUpload.MaxFileSizeBytes)
            return Result.Failure($"File size exceeds the limit.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AppConstants.FileUpload.AllowedImageExtensions.Contains(ext))
            return Result.Failure($"Allowed file types: {string.Join(", ", AppConstants.FileUpload.AllowedImageExtensions)}");
        return Result.Success();
    }

    private static ArtworkDto MapToDto(Artwork a) => new(
        Id: a.Id, Title: a.Title, Description: a.Description, ImageUrl: a.ImageUrl,
        ArtistId: a.ArtistId, ArtistName: a.Artist?.DisplayName ?? a.Artist?.Email,
        Dimensions: a.Dimensions, Materials: a.Materials, Year: a.Year, Price: a.Price,
        ArtworkType: a.ArtworkType, AudioUrl: a.AudioUrl, IsPublished: a.IsPublished,
        PositionX: a.PositionX, PositionY: a.PositionY, PositionZ: a.PositionZ,
        RotationX: a.RotationX, RotationY: a.RotationY, RotationZ: a.RotationZ,
        ScaleX: a.ScaleX, ScaleY: a.ScaleY, ScaleZ: a.ScaleZ,
        CreatedAt: a.CreatedAt, UpdatedAt: a.UpdatedAt,
        ColorMood: a.ColorMood, VisualStyle: a.VisualStyle, Subject: a.Subject,
        Mood: a.Mood, DominantColors: a.DominantColors,
        IsVisuallyAnalyzed: a.IsVisuallyAnalyzed
    );
}