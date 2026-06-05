// Application/DTOs/GalleryCustomization/GalleryCustomizationDto.cs
using System;
using System.Collections.Generic;

namespace VirtualArtGallery.Application.DTOs.GalleryCustomization;

public class GalleryCustomizationDto
{
    public StructureDto Structure { get; set; } = new();
    public WallsDto Walls { get; set; } = new();
    public FloorDto Floor { get; set; } = new();
    public LightingDto Lighting { get; set; } = new();
    public List<FurnitureItemDto> Furniture { get; set; } = new();
    public EnvironmentDto Environment { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
    public bool IsPremium { get; set; }
}

public class StructureDto
{
    public string LayoutType { get; set; } = "single_room";
    public float WallHeight { get; set; } = 4.8f;
    public float RoomWidth { get; set; } = 22f;
    public float RoomDepth { get; set; } = 22f;
    public string CeilingType { get; set; } = "flat";
    public bool Pillars { get; set; }
    public float PillarRadius { get; set; } = 0.32f;
    public string? Shape { get; set; } = "rectangle";  // ← أضيف هذا
}

public class WallsDto
{
    public string Material { get; set; } = "plaster";
    public string Color { get; set; } = "#ece6dc";
    public string? TextureUrl { get; set; }
    public string? Pattern { get; set; }
    public float Roughness { get; set; } = 0.7f;
    public float Metalness { get; set; } = 0f;
    public WainscotingDto Wainscoting { get; set; } = new();
    public AccentWallDto AccentWall { get; set; } = new();
    public MoldingsDto Moldings { get; set; } = new();
}

public class WainscotingDto
{
    public bool Enabled { get; set; }
    public float Height { get; set; } = 0.9f;
    public string Color { get; set; } = "#f2ede2";
    public string Material { get; set; } = "wood";
}

public class AccentWallDto
{
    public bool Enabled { get; set; }
    public string Wall { get; set; } = "front";
    public string Color { get; set; } = "#c9a96e";
}

public class MoldingsDto
{
    public bool Enabled { get; set; }
    public string Style { get; set; } = "classic";
    public string Color { get; set; } = "#c9a96e";
}

public class FloorDto
{
    public string Material { get; set; } = "hardwood";
    public string Color { get; set; } = "#231b0f";
    public string? Pattern { get; set; }
    public float Gloss { get; set; } = 0.1f;
    public float Roughness { get; set; } = 0.5f;
    public RugDto Rug { get; set; } = new();
}

public class RugDto
{
    public bool Enabled { get; set; }
    public string Style { get; set; } = "persian";
    public string Color { get; set; } = "#8b5cf6";
    public string Size { get; set; } = "medium";
    public string Shape { get; set; } = "rectangle";
}

public class LightingDto
{
    public AmbientLightDto AmbientLight { get; set; } = new();
    public MainLightingDto MainLighting { get; set; } = new();
    public SpotlightsDto Spotlights { get; set; } = new();
    public WindowsDto Windows { get; set; } = new();
    public AccentLightingDto AccentLighting { get; set; } = new();
}

public class AmbientLightDto
{
    public float Intensity { get; set; } = 0.75f;
    public string Color { get; set; } = "#fff4e6";
}

public class MainLightingDto
{
    public string Type { get; set; } = "chandelier";
    public float Intensity { get; set; } = 0.85f;
    public string ColorTemp { get; set; } = "warm";
    public string? CustomColor { get; set; }
}

public class SpotlightsDto
{
    public bool Enabled { get; set; } = true;
    public int Count { get; set; } = 8;
    public float Intensity { get; set; } = 1.2f;
    public float Angle { get; set; } = 0.55f;
}

public class WindowsDto
{
    public bool Enabled { get; set; } = true;
    public int Count { get; set; } = 4;
    public string Size { get; set; } = "medium";
    public string Direction { get; set; } = "all";
    public string TimeOfDay { get; set; } = "afternoon";
}

public class AccentLightingDto
{
    public bool Enabled { get; set; }
    public string Type { get; set; } = "led_strips";
    public string Color { get; set; } = "#c9a96e";
    public float Intensity { get; set; } = 0.5f;
}

public class FurnitureItemDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = string.Empty;
    public string ModelUrl { get; set; } = string.Empty;
    public Position3DDto Position { get; set; } = new();
    public float Rotation { get; set; }
    public float Scale { get; set; } = 1f;
    public string? Color { get; set; }
    public string? Material { get; set; }
}

public class Position3DDto
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}

public class EnvironmentDto
{
    public string OutsideView { get; set; } = "city";
    public string Weather { get; set; } = "clear";
    public ParticleEffectsDto ParticleEffects { get; set; } = new();
    public AudioAmbienceDto AudioAmbience { get; set; } = new();
    public FogDto Fog { get; set; } = new();
}

public class ParticleEffectsDto
{
    public bool Enabled { get; set; }
    public string Type { get; set; } = "sparkles";
    public int Density { get; set; } = 50;
}

public class AudioAmbienceDto
{
    public bool Enabled { get; set; }
    public string? TrackUrl { get; set; }
    public float Volume { get; set; } = 0.5f;
    public bool Loop { get; set; } = true;
}

public class FogDto
{
    public bool Enabled { get; set; }
    public float Density { get; set; } = 0.02f;
    public string Color { get; set; } = "#ffffff";
}