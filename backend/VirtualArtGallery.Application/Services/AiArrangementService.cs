using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.AI;
using VirtualArtGallery.Core.Interfaces;

namespace VirtualArtGallery.Application.Services;

public class AiArrangementService
{
    private readonly IAzureOpenAIService _openAI;
    private readonly ILogger<AiArrangementService> _logger;

    public AiArrangementService(
        IAzureOpenAIService openAI,
        ILogger<AiArrangementService> logger)
    {
        _openAI  = openAI;
        _logger  = logger;
    }

    public async Task<Result<ArtworkArrangementResultDto>> SuggestArrangementAsync(
        ArtworkArrangementRequestDto request)
    {
        if (request.Artworks == null || request.Artworks.Count == 0)
            return Result<ArtworkArrangementResultDto>.Failure("No artworks provided.");

        try
        {
            var systemPrompt =
                "You are an expert art curator. Respond ONLY with valid JSON — " +
                "no markdown, no explanation outside the JSON object.";

            var userPrompt = BuildPrompt(request);

            var raw = await _openAI.GetCompletionAsync(systemPrompt, userPrompt);
            _logger.LogDebug("AI arrangement raw response: {Raw}", raw);

            var placements = ParsePlacements(raw, request.Artworks, request.GalleryLayout);

            if (placements.Count == 0)
                placements = Fallback(request.Artworks, request.GalleryLayout);

            return Result<ArtworkArrangementResultDto>.Success(new ArtworkArrangementResultDto(
                Placements:  placements,
                Explanation: ExtractExplanation(raw)
            ));
        }
        catch
        {
            var fallback = Fallback(request.Artworks, request.GalleryLayout);
            return Result<ArtworkArrangementResultDto>.Success(new ArtworkArrangementResultDto(
                Placements:  fallback,
                Explanation: "Artworks arranged in a balanced composition across all gallery walls."
            ));
        }
    }

    // ── Prompt ────────────────────────────────────────────────────────────────

    private static string BuildPrompt(ArtworkArrangementRequestDto req)
    {
        var walls = req.GalleryLayout.WallSegments;
        var wallList = string.Join(", ", walls.Select(w => $"{w.WallId}({w.PositionCount} slots)"));

        var artworkList = string.Join("\n", req.Artworks.Select(a =>
            $"- ID={a.Id} | \"{a.Title}\" | {a.ArtworkType} | " +
            $"Materials={a.Materials ?? "unknown"} | " +
            $"Desc={Truncate(a.Description, 80)}"));

        var wallIds = string.Join(", ", walls.Select(w => $"\"{w.WallId}\""));

        var prompt = string.Format(
            "Arrange {0} artworks across these gallery walls: {1}\n" +
            "Group similar artworks by ColorMood, VisualStyle, Subject, and Mood on the same wall.\n" + "Artworks with same color mood or visual style should be on the same wall.\n\n" +
            "Artworks:\n{2}\n\n" +
            "RULES:\n" +
            "- Return ONLY JSON, no explanation text outside JSON\n" +
            "- wallId must be EXACTLY one of [{3}]\n" +
            "- Include ALL {0} artworks in placements\n" +
            "- positionIndex starts at 0 per wall\n\n" +
            "RESPOND WITH THIS EXACT JSON FORMAT:\n" +
            "{{\"explanation\": \"your grouping logic\", \"placements\": [{{\"artworkId\": \"id\", \"wallId\": \"front\", \"positionIndex\": 0, \"placementReason\": \"reason\"}}]}}",
            req.Artworks.Count, wallList, artworkList, wallIds);
        return prompt;
    }

    // ── Parse AI response ─────────────────────────────────────────────────────

    private List<ArtworkPlacementDto> ParsePlacements(
        string raw,
        List<ArtworkForAnalysisDto> artworks,
        GalleryLayoutInfoDto layout)
    {
        try
        {
            var json = raw.Trim();
            if (json.StartsWith("```"))
                json = string.Join('\n',
                    json.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")));

            var start = json.IndexOf('{');
            var end   = json.LastIndexOf('}');
            if (start < 0 || end <= start) return [];

            json = json[start..(end + 1)];

            using var doc  = JsonDocument.Parse(json);
            var items      = doc.RootElement.GetProperty("placements");
            var seen       = new HashSet<string>();
            var wallCounts = new Dictionary<string, int>();
            var result     = new List<ArtworkPlacementDto>();

            foreach (var item in items.EnumerateArray())
            {
                var artworkId = item.GetProperty("artworkId").GetString() ?? "";
                var wallId    = item.GetProperty("wallId").GetString()    ?? "front";

                if (!artworks.Any(a => a.Id == artworkId)) continue;
                if (!seen.Add(artworkId)) continue;

                wallId = wallId.ToLower() switch
                {
                    "front" or "back" or "left" or "right" => wallId.ToLower(),
                    _ => layout.WallSegments.FirstOrDefault()?.WallId ?? "front"
                };

                wallCounts.TryGetValue(wallId, out var idx);
                var pos = GetPosition(wallId, idx, layout);
                wallCounts[wallId] = idx + 1;

                var reason = item.TryGetProperty("placementReason", out var r)
                    ? r.GetString() ?? "AI suggested" : "AI suggested";

                result.Add(new ArtworkPlacementDto(
                    ArtworkId:       artworkId,
                    PositionX:       pos.x,
                    PositionY:       pos.y,
                    PositionZ:       pos.z,
                    RotationY:       DefaultRotation(wallId),
                    WallId:          wallId,
                    PlacementReason: reason
                ));
            }

            var missing = artworks.Where(a => !seen.Contains(a.Id)).ToList();
            var fallbackWall = layout.WallSegments.FirstOrDefault()?.WallId ?? "front";
            foreach (var a in missing)
            {
                wallCounts.TryGetValue(fallbackWall, out var idx);
                var pos = GetPosition(fallbackWall, idx, layout);
                wallCounts[fallbackWall] = idx + 1;
                result.Add(new ArtworkPlacementDto(a.Id, pos.x, pos.y, pos.z,
                    DefaultRotation(fallbackWall), fallbackWall, "Auto-placed"));
            }

            return result;
        }
        catch
        {
            return [];
        }
    }

    // ── Fallback: round-robin across walls ────────────────────────────────────

    private List<ArtworkPlacementDto> Fallback(
        List<ArtworkForAnalysisDto> artworks,
        GalleryLayoutInfoDto layout)
    {
        var walls  = layout.WallSegments.Select(w => w.WallId).ToList();
        if (walls.Count == 0) walls = ["front", "back", "left", "right"];

        var counts = walls.ToDictionary(w => w, _ => 0);
        var result = new List<ArtworkPlacementDto>();

        foreach (var (a, i) in artworks.Select((a, i) => (a, i)))
        {
            var wallId = walls[i % walls.Count];
            var pos    = GetPosition(wallId, counts[wallId], layout);
            counts[wallId]++;
            result.Add(new ArtworkPlacementDto(
                a.Id, pos.x, pos.y, pos.z,
                DefaultRotation(wallId), wallId,
                "Distributed evenly across walls"));
        }

        return result;
    }

    // ── Position calculator ───────────────────────────────────────────────────

    private static (double x, double y, double z) GetPosition(
        string wallId, int index, GalleryLayoutInfoDto layout)
    {
        const double Y = 1.65;
        var hW = layout.RoomWidth  / 2;
        var hD = layout.RoomDepth  / 2;

        var wall = layout.WallSegments.FirstOrDefault(w =>
            string.Equals(w.WallId, wallId, StringComparison.OrdinalIgnoreCase));

        var slots = wall?.PositionCount ?? 4;
        var t     = (index + 0.5) / Math.Max(slots, 1);

        return wallId.ToLower() switch
        {
            "front" => (Interpolate(-hW, hW, t), Y, -hD + 0.12),
            "back"  => (Interpolate(-hW, hW, t), Y,  hD - 0.12),
            "left"  => (-hW + 0.12, Y, Interpolate(-hD, hD, t)),
            "right" => ( hW - 0.12, Y, Interpolate(-hD, hD, t)),
            _       => (0, Y, 0)
        };
    }

    private static double DefaultRotation(string wallId) => wallId.ToLower() switch
    {
        "front" => 0,
        "back"  => Math.PI,
        "left"  => Math.PI / 2,
        "right" => -Math.PI / 2,
        _       => 0
    };

    private static double Interpolate(double a, double b, double t) => a + (b - a) * t;

    private static string Truncate(string? s, int max) =>
        string.IsNullOrWhiteSpace(s) ? "no description"
        : s.Length <= max ? s : s[..max] + "…";

    private static string ExtractExplanation(string raw)
    {
        try
        {
            var start = raw.IndexOf('{');
            var end   = raw.LastIndexOf('}');
            if (start < 0 || end <= start) return "Artworks arranged by AI.";
            using var doc = JsonDocument.Parse(raw[start..(end + 1)]);
            return doc.RootElement.TryGetProperty("explanation", out var e)
                ? e.GetString() ?? "Artworks arranged by AI."
                : "Artworks arranged by AI.";
        }
        catch { return "Artworks arranged by AI."; }
    }
}