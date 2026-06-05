using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text.Json;
using VirtualArtGallery.Core.Interfaces;

namespace VirtualArtGallery.Infrastructure.Services;

public class HuggingFaceVisionService : IHuggingFaceService
{
    private static readonly Random _rng = new();
    private readonly HttpClient _http;
    private readonly ILogger<HuggingFaceVisionService> _logger;
    private readonly string? _apiToken;

    private const string API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";

    public HuggingFaceVisionService(
        HttpClient http,
        IConfiguration config,
        ILogger<HuggingFaceVisionService> logger)
    {
        _http       = http;
        _logger     = logger;
        _apiToken   = config["HuggingFaceSettings:ApiToken"]
                    ?? config["HF_TOKEN"]
                    ?? Environment.GetEnvironmentVariable("HF_TOKEN");

        _http.Timeout = TimeSpan.FromSeconds(60);
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _apiToken);
    }

    // ── Public: describe image ────────────────────────────────────────────────

    public async Task<string> DescribeImageAsync(
        string imageBase64, string title, string artworkType)
    {
        if (string.IsNullOrEmpty(_apiToken))
        {
            _logger.LogWarning("No HuggingFace token — using fallback");
            return GetFallbackDescription(artworkType);
        }

        try
        {
            var imageBytes = ConvertBase64ToBytes(imageBase64);
            if (imageBytes == null || imageBytes.Length < 100)
            {
                _logger.LogWarning("Invalid image data");
                return GetFallbackDescription(artworkType);
            }

            _logger.LogInformation("Sending image of size: {Size} bytes", imageBytes.Length);

            var payload = new
            {
                inputs = Convert.ToBase64String(imageBytes),
                parameters = new { max_length = 50, min_length = 10, num_beams = 3 }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                System.Text.Encoding.UTF8,
                "application/json");

            var response    = await _http.PostAsync(API_URL, content);
            var responseJson = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("HF response status: {Status}", response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var description = ParseDescriptionFromResponse(responseJson);
                if (!string.IsNullOrEmpty(description) && description.Length > 10)
                {
                    _logger.LogInformation("HF description: {Desc}", description);
                    return description;
                }
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
            {
                _logger.LogInformation("Model loading — retrying in 10s");
                await Task.Delay(10000);
                return await DescribeImageAsync(imageBase64, title, artworkType);
            }
            else
            {
                _logger.LogWarning("HF API error {Status}: {Body}",
                    response.StatusCode, responseJson);
            }

            return GetFallbackDescription(artworkType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HuggingFace vision failed");
            return GetFallbackDescription(artworkType);
        }
    }

    // ── Public: suggest titles ────────────────────────────────────────────────

    public async Task<List<string>> SuggestTitlesFromImageAsync(
        string imageBase64, string artworkType)
    {
        try
        {
            var description = await DescribeImageAsync(imageBase64, "", artworkType);

            if (IsGenericDescription(description))
            {
                _logger.LogInformation("HF returned generic description — using fallback titles");
                return GetFallbackTitles();
            }

            _logger.LogInformation("Generating titles from HF description: {Desc}", description);

            var titles = GenerateUniqueTitles(description, artworkType);

            if (titles.Count < 3)
                titles.AddRange(GetFallbackTitles());

            return titles.Distinct().Take(8).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SuggestTitlesFromImageAsync failed");
            return GetFallbackTitles();
        }
    }

    // ── Public: analyze visuals ───────────────────────────────────────────────

    public async Task<ArtworkVisualAnalysis> AnalyzeArtworkVisualsAsync(
        string imageBase64, string title, string artworkType)
    {
        try
        {
            var description = await DescribeImageAsync(imageBase64, title, artworkType);
            _logger.LogInformation("Analyzing visuals from: {Desc}", description);
            return ExtractVisualsFromDescription(description, artworkType);
        }
        catch
        {
            return new ArtworkVisualAnalysis("neutral", "contemporary", "abstract", "calm", "neutral");
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private byte[]? ConvertBase64ToBytes(string imageBase64)
    {
        try
        {
            var clean = imageBase64.Contains(",")
                ? imageBase64[(imageBase64.IndexOf(',') + 1)..].Trim()
                : imageBase64.Trim();

            if (string.IsNullOrEmpty(clean)) return null;

            var padding = clean.Length % 4;
            if (padding != 0) clean += new string('=', 4 - padding);

            return Convert.FromBase64String(clean);
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Failed to convert Base64");
            return null;
        }
    }

    private string ParseDescriptionFromResponse(string responseJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseJson);

            if (doc.RootElement.ValueKind == JsonValueKind.Array
                && doc.RootElement.GetArrayLength() > 0)
            {
                var first = doc.RootElement[0];
                if (first.TryGetProperty("generated_text", out var t))
                    return t.GetString() ?? "";
            }

            if (doc.RootElement.TryGetProperty("generated_text", out var dt))
                return dt.GetString() ?? "";

            if (doc.RootElement.ValueKind == JsonValueKind.String)
                return doc.RootElement.GetString() ?? "";

            _logger.LogWarning("Unknown HF response format: {Json}", responseJson);
            return "";
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON parsing failed");
            return "";
        }
    }

    // Returns true when HF is unreachable and we're using a canned sentence
    private static bool IsGenericDescription(string desc)
    {
        if (string.IsNullOrWhiteSpace(desc)) return true;
        var d = desc.ToLower();
        return d.Contains("masterfully creates")
            || d.Contains("titled '")
            || d.Contains("exceptional skill and emotional depth")
            || d.Contains("world of imagination")
            || d.Contains("captivating {")
            || (d.Contains("contemporary art") && d.Contains("essence"));
    }

    private List<string> GenerateUniqueTitles(string description, string artworkType)
    {
        if (string.IsNullOrEmpty(description) || description.Length < 10)
            return new List<string>();

        var titles   = new List<string>();
        var keywords = ExtractKeywords(description);

        if (keywords.Count == 0) return titles;

        titles.Add($"Whispers of {keywords[0]}");
        titles.Add($"Echoes in {keywords[0]}");
        titles.Add($"The Soul of {keywords[0]}");

        if (keywords.Count > 1)
        {
            titles.Add($"{keywords[0]} & {keywords[1]}");
            titles.Add($"Where {keywords[0]} Meets {keywords[1]}");
        }

        if (keywords.Count > 2)
            titles.Add($"A {keywords[0]} {keywords[1]} {keywords[2]}");

        titles.Add(artworkType?.ToLower() switch
        {
            "photography" => $"Captured {keywords[0]}",
            "sculpture"   => $"Forms of {keywords[0]}",
            "digital"     => $"Digital {keywords[0]}",
            _             => $"Brushstrokes of {keywords[0]}"
        });

        return titles;
    }

    private List<string> ExtractKeywords(string description)
    {
        var words = description.ToLower()
            .Replace(".", " ").Replace(",", " ").Replace("!", " ")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3 && !StopWords.Contains(w))
            .Select(w => char.ToUpper(w[0]) + w[1..])
            .Distinct()
            .ToList();

        var priority = words.Where(w =>
            w is "Dream" or "Soul" or "Heart" or "Light" or "Shadow"
                or "Time" or "Love" or "Fire" or "Water" or "Earth"
                or "Storm" or "Peace" or "Dark" or "Dawn" or "Dusk"
                or "Rain" or "Wind" or "Moon" or "Star" or "Life").ToList();

        return priority.Count > 0 ? priority : words.Take(5).ToList();
    }

    private ArtworkVisualAnalysis ExtractVisualsFromDescription(
        string description, string artworkType)
    {
        var d = description.ToLower();

        var colorMood =
            d.Contains("dark") || d.Contains("black") || d.Contains("shadow") ? "dark"
            : d.Contains("bright") || d.Contains("vibrant") || d.Contains("colorful") ? "bright"
            : d.Contains("warm") || d.Contains("gold") || d.Contains("sun") ? "warm"
            : d.Contains("cool") || d.Contains("blue") || d.Contains("water") ? "cool"
            : "neutral";

        var mood =
            d.Contains("sad") || d.Contains("melancholy") || d.Contains("lonely") ? "melancholic"
            : d.Contains("happy") || d.Contains("joy") || d.Contains("cheerful") ? "joyful"
            : d.Contains("calm") || d.Contains("peaceful") || d.Contains("quiet") ? "serene"
            : d.Contains("mysterious") || d.Contains("dark") ? "mysterious"
            : "calm";

        var style = artworkType?.ToLower() switch
        {
            "digital"     => "contemporary",
            "photography" => "realistic",
            "sculpture"   => "classical",
            _ => d.Contains("abstract") ? "abstract"
               : d.Contains("realistic") || d.Contains("detailed") ? "realistic"
               : "modern"
        };

        return new ArtworkVisualAnalysis(
            colorMood, style, DetermineSubject(d), mood, "balanced");
    }

    private static string DetermineSubject(string d)
    {
        if (d.Contains("person") || d.Contains("woman") || d.Contains("man") || d.Contains("face"))
            return "portrait";
        if (d.Contains("landscape") || d.Contains("mountain") || d.Contains("nature") || d.Contains("tree"))
            return "landscape";
        if (d.Contains("animal") || d.Contains("bird") || d.Contains("cat") || d.Contains("dog"))
            return "animal";
        if (d.Contains("abstract") || d.Contains("pattern") || d.Contains("geometric"))
            return "abstract";
        if (d.Contains("city") || d.Contains("street") || d.Contains("building"))
            return "urban";
        return "still_life";
    }

    // No title or artworkType in the fallback — avoids polluting keywords
    private string GetFallbackDescription(string artworkType)
    {
        var type = artworkType?.ToLower() ?? "artwork";
        var descriptions = new[]
        {
            $"A {type} with warm colors and dramatic light, featuring rich textures and deep shadows.",
            $"A {type} depicting a serene landscape with cool blue tones and natural elements.",
            $"A vibrant {type} with bold geometric shapes and contrasting colors.",
            $"A {type} with soft pastel tones, delicate lines, and a peaceful composition.",
            $"A dark and moody {type} with strong contrasts and emotional depth.",
        };
        return descriptions[_rng.Next(descriptions.Length)];
    }

    private static List<string> GetFallbackTitles() => new()
    {
        "Whispers of Eternity",
        "Dreams in Monochrome",
        "The Silent Echo",
        "Where Colors Dance",
        "A Moment in Time",
        "Shadows of Imagination",
        "The Artist's Soul",
    };

    private static readonly HashSet<string> StopWords = new()
    {
        "a", "an", "the", "and", "of", "to", "in", "for", "on", "with", "by", "at",
        "this", "that", "these", "those", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "having", "do", "does", "did", "doing", "but", "so", "if", "then",
        "painting", "artwork", "piece", "work", "image", "picture", "photo", "art",
        "very", "much", "some", "from", "also", "been", "each", "into", "more",
        "over", "such", "than", "their", "them", "they", "what", "when", "which",
        "while", "will", "with", "would", "your",
    };
}