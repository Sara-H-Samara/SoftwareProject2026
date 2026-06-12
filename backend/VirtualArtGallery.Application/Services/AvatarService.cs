using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Avatars;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class AvatarService
{
    private readonly ApplicationDbContext _context;

    public AvatarService(ApplicationDbContext context) => _context = context;

    public async Task<Result<AvatarDto>> GetMineAsync(string userId)
    {
        var avatar = await _context.Avatars.FirstOrDefaultAsync(a => a.UserId == userId);
        if (avatar == null)
        {
            avatar = CreateDefault(userId);
            _context.Avatars.Add(avatar);
            await _context.SaveChangesAsync();
        }
        return Result<AvatarDto>.Success(ToDto(avatar));
    }

    public async Task<Result<AvatarDto>> GetByUserIdAsync(string userId)
    {
        var avatar = await _context.Avatars.FirstOrDefaultAsync(a => a.UserId == userId);
        if (avatar == null)
            return Result<AvatarDto>.NotFound("Avatar not found.");
        return Result<AvatarDto>.Success(ToDto(avatar));
    }

    public async Task<Result<AvatarDto>> UpsertMineAsync(string userId, UpdateAvatarRequestDto dto)
    {
        var avatar = await _context.Avatars.FirstOrDefaultAsync(a => a.UserId == userId);
        if (avatar == null)
        {
            avatar = CreateDefault(userId);
            _context.Avatars.Add(avatar);
        }

        if (dto.SkinColor != null) avatar.SkinColor = dto.SkinColor;
        if (dto.Height.HasValue) avatar.Height = dto.Height.Value;
        if (dto.HairStyle != null) avatar.HairStyle = dto.HairStyle;
        if (dto.HairColor != null) avatar.HairColor = dto.HairColor;
        if (dto.ShirtStyle != null) avatar.ShirtStyle = dto.ShirtStyle;
        if (dto.ShirtColor != null) avatar.ShirtColor = dto.ShirtColor;
        if (dto.PantsStyle != null) avatar.PantsStyle = dto.PantsStyle;
        if (dto.PantsColor != null) avatar.PantsColor = dto.PantsColor;
        if (dto.ShoesColor != null) avatar.ShoesColor = dto.ShoesColor;
        if (dto.Accessory != null) avatar.Accessory = dto.Accessory;
        if (dto.AccessoryColor != null) avatar.AccessoryColor = dto.AccessoryColor;

        avatar.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Result<AvatarDto>.Success(ToDto(avatar));
    }

    private static Avatar CreateDefault(string userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    private static AvatarDto ToDto(Avatar a) => new(
        a.Id, a.UserId, a.SkinColor, a.Height,
        a.HairStyle, a.HairColor, a.ShirtStyle, a.ShirtColor,
        a.PantsStyle, a.PantsColor, a.ShoesColor,
        a.Accessory, a.AccessoryColor, a.UpdatedAt
    );
}
