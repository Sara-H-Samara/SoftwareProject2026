using System.Text.Json;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.AI;
using VirtualArtGallery.Core.Interfaces;

namespace VirtualArtGallery.Application.Services;

public class AiService
{
    private readonly IAzureOpenAIService _openAI;

    public AiService(IAzureOpenAIService openAI)
    {
        _openAI = openAI;
    }

    public async Task<Result<SuggestedDescriptionDto>> SuggestDescriptionAsync(DescriptionPromptDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return Result<SuggestedDescriptionDto>.Failure("Artwork title is required to generate a description.");

        var description = await _openAI.GenerateArtworkDescriptionAsync(
            dto.Title,
            dto.ArtworkType,
            dto.Materials,
            dto.AdditionalContext);

        return Result<SuggestedDescriptionDto>.Success(new SuggestedDescriptionDto(description));
    }

    public async Task<Result<InspirationResultDto>> GetInspirationAsync(InspirationPromptDto dto)
    {
        var ideas = await _openAI.GenerateInspirationAsync(
            dto.ArtistBio ?? "A creative art student",
            dto.PreferredStyle ?? "mixed media",
            dto.NumberOfIdeas);

        return Result<InspirationResultDto>.Success(new InspirationResultDto(ideas));
    }

    public async Task<Result<SuggestTitleResponseDto>> SuggestTitlesAsync(SuggestTitleRequestDto dto)
    {
        var suggestions = await _openAI.SuggestTitlesAsync(
            dto.Description, dto.ArtworkType, dto.Materials,
            dto.AdditionalContext, dto.ImageUrl);
        return Result<SuggestTitleResponseDto>.Success(new SuggestTitleResponseDto(suggestions));
    }

    public async Task<Result<AnalyzeImageResponseDto>> AnalyzeImageForUploadAsync(
        AnalyzeImageRequestDto dto)
    {
        try
        {
            var raw = await _openAI.AnalyzeImageForUploadAsync(
                dto.ImageUrl, dto.ArtworkType);

            var json = StripMarkdown(raw);

            if (string.IsNullOrWhiteSpace(json) || json == "{}")
                return Result<AnalyzeImageResponseDto>.Success(BuildFallback(dto.ArtworkType));

            using var doc  = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var alternatives = new List<string>();
            if (root.TryGetProperty("titleAlternatives", out var alts))
                foreach (var item in alts.EnumerateArray())
                {
                    var s = item.GetString();
                    if (!string.IsNullOrEmpty(s)) alternatives.Add(s);
                }

            decimal? price = null;
            if (root.TryGetProperty("suggestedPrice", out var priceEl)
                && priceEl.ValueKind == JsonValueKind.Number)
                price = priceEl.GetDecimal();

            var result = new AnalyzeImageResponseDto(
                SuggestedTitle:       GetProp(root, "suggestedTitle",       "Untitled"),
                SuggestedDescription: GetProp(root, "suggestedDescription", ""),
                SuggestedMaterials:   GetProp(root, "suggestedMaterials",   null),
                SuggestedArtworkType: GetProp(root, "suggestedArtworkType", null),
                SuggestedPrice:       price,
                ColorMood:            GetProp(root, "colorMood",            "neutral"),
                VisualStyle:          GetProp(root, "visualStyle",          "contemporary"),
                Subject:              GetProp(root, "subject",              "abstract"),
                Mood:                 GetProp(root, "mood",                 "calm"),
                TitleAlternatives:    alternatives
            );

            return Result<AnalyzeImageResponseDto>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<AnalyzeImageResponseDto>.Failure(
                $"Image analysis failed: {ex.Message}");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static AnalyzeImageResponseDto BuildFallback(string? artworkType) =>
        new(
            SuggestedTitle:       "Untitled",
            SuggestedDescription: "",
            SuggestedMaterials:   null,
            SuggestedArtworkType: artworkType,
            SuggestedPrice:       null,
            ColorMood:            "neutral",
            VisualStyle:          "contemporary",
            Subject:              "abstract",
            Mood:                 "calm",
            TitleAlternatives:    new List<string>()
        );

    private static string StripMarkdown(string raw)
    {
        var json = raw.Trim();
        if (json.StartsWith("```"))
            json = string.Join('\n', json.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")));
        var start = json.IndexOf('{');
        var end   = json.LastIndexOf('}');
        return start >= 0 && end > start ? json[start..(end + 1)] : json;
    }

    private static string? GetProp(JsonElement root, string key, string? fallback) =>
        root.TryGetProperty(key, out var el) ? el.GetString() ?? fallback : fallback;
}