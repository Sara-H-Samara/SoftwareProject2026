using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using VirtualArtGallery.Core.Constants;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Infrastructure.Services;

public class AzureOpenAIService : IAzureOpenAIService
{
    private readonly OpenAISettings _settings;
    private readonly ILogger<AzureOpenAIService> _logger;
    private readonly HttpClient _httpClient;
    private readonly IHuggingFaceService _huggingFace;

    private const string GeminiTextUrl   = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    private const string GeminiVisionUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    public AzureOpenAIService(
        IOptions<OpenAISettings> settings,
        ILogger<AzureOpenAIService> logger,
        HttpClient httpClient,
        IHuggingFaceService huggingFace)
    {
        _settings    = settings.Value;
        _logger      = logger;
        _httpClient  = httpClient;
        _huggingFace = huggingFace;
    }

    // ── Generate Description ──────────────────────────────────────────────────

    public async Task<string> GenerateArtworkDescriptionAsync(
        string title, string artworkType, string? materials, string? additionalContext)
    {
        try
        {
            _logger.LogInformation("Generating description for artwork: {Title}", title);
            if (IsApiKeyMissing()) return GetMockDescription(title, artworkType, materials);

            var prompt = BuildDescriptionPrompt(title, artworkType, materials, additionalContext);
            return await CallGeminiText(AppConstants.AiPrompts.ArtworkDescriptionSystem + "\n" + prompt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate description for {Title}", title);
            return GetMockDescription(title, artworkType, materials);
        }
    }

    // ── Generate Inspiration ──────────────────────────────────────────────────

    public async Task<string> GenerateInspirationAsync(
        string artistBio, string preferredStyle, int numberOfIdeas = 3)
    {
        try
        {
            _logger.LogInformation("Generating {Count} inspiration ideas", numberOfIdeas);
            if (IsApiKeyMissing()) return GetMockInspiration(artistBio, preferredStyle, numberOfIdeas);

            var prompt = $"Generate {numberOfIdeas} creative artwork ideas for an artist. " +
                $"Bio: {artistBio}. Preferred style: {preferredStyle}. " +
                $"Return each idea as a separate paragraph.";

            return await CallGeminiText(prompt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate inspiration");
            return GetMockInspiration(artistBio, preferredStyle, numberOfIdeas);
        }
    }

    // ── Suggest Titles ────────────────────────────────────────────────────────

    public async Task<List<string>> SuggestTitlesAsync(
        string? description, string? artworkType, string? materials,
        string? additionalContext, string? imageUrl = null)
    {
        try
        {
            _logger.LogInformation("Generating title suggestions (hasImage={HasImage})", imageUrl != null);

            if (!string.IsNullOrEmpty(imageUrl) && imageUrl.StartsWith("data:"))
            {
                _logger.LogInformation("Image is base64 data URL — using HuggingFace Vision");
                try
                {
                    var hfTitles = await _huggingFace.SuggestTitlesFromImageAsync(imageUrl, artworkType ?? "artwork");
                    if (hfTitles?.Count > 0) return hfTitles;
                }
                catch (Exception hfEx)
                {
                    _logger.LogWarning(hfEx, "HuggingFace failed");
                }
            }

            if (!string.IsNullOrEmpty(imageUrl) && !imageUrl.StartsWith("data:"))
            {
                try
                {
                    var hfTitles = await _huggingFace.SuggestTitlesFromImageAsync(imageUrl, artworkType ?? "artwork");
                    if (hfTitles?.Count > 0) return hfTitles;
                }
                catch (Exception hfEx)
                {
                    _logger.LogWarning(hfEx, "HuggingFace failed for external URL");
                }
            }

            if (IsApiKeyMissing()) return GetMockTitles();

            var prompt = "You are a creative art title generator. " +
                "Suggest 5 creative, evocative, and memorable titles that feel poetic and professional. " +
                "Return ONLY a JSON array: [\"Title 1\", \"Title 2\", \"Title 3\", \"Title 4\", \"Title 5\"]\n\n" +
                $"Generate 5 titles. Type: {artworkType ?? "unknown"}. " +
                $"Materials: {materials ?? "unknown"}. " +
                $"Description: {description ?? "none"}.";

            var response = await CallGeminiText(prompt);
            return ParseTitleSuggestions(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate title suggestions");
            return GetMockTitles();
        }
    }

    // ── Analyze Image for Upload ──────────────────────────────────────────────

    public async Task<string> AnalyzeImageForUploadAsync(
        string imageUrl, string? artworkType = null)
    {
        var prompt = $@"You are an expert art curator analyzing an artwork image.
Respond ONLY with valid JSON — no markdown, no extra text.

Return exactly this JSON:
{{
  ""suggestedTitle"": ""creative title here"",
  ""suggestedDescription"": ""2-3 sentences describing the artwork's visual qualities, mood, and technique"",
  ""suggestedMaterials"": ""e.g. Oil on canvas"",
  ""suggestedArtworkType"": ""Painting"",
  ""suggestedPrice"": 250,
  ""colorMood"": ""warm"",
  ""visualStyle"": ""contemporary"",
  ""subject"": ""portrait"",
  ""mood"": ""calm"",
  ""titleAlternatives"": [""Alt title 1"", ""Alt title 2"", ""Alt title 3""]
}}

For suggestedPrice: estimate a reasonable market price in USD based on the style and complexity.
For suggestedArtworkType: use one of: Painting, Drawing, Photography, Sculpture, Digital, Print, Mixed Media, Other.
{(artworkType != null ? $"Artist indicated type: {artworkType}" : "")}";

        try
        {
            _logger.LogInformation("Analyzing image for upload suggestions");
            return await CallGeminiVision(imageUrl, prompt);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AnalyzeImageForUpload failed");
            return "{}";
        }
    }

    // ── Arrange Gallery ───────────────────────────────────────────────────────

    public async Task<GalleryArrangementResult> ArrangeGalleryAsync(
        List<ArtworkForArrangementInput> artworks, int wallCount)
    {
        wallCount = Math.Clamp(wallCount, 1, artworks.Count);
        if (IsApiKeyMissing()) return FallbackArrangement(artworks, wallCount);

        try
        {
            var artworkList = string.Join("\n", artworks.Select((a, i) =>
                $"{i + 1}. ID={a.Id} | \"{a.Title}\" | Type={a.ArtworkType} | " +
                $"Materials={a.Materials ?? "unknown"} | Desc={Truncate(a.Description, 80)}"));

            var prompt = "You are an expert gallery curator. Group artworks by visual and thematic similarity. " +
                "Respond ONLY with valid JSON — no markdown, no extra text.\n\n" +
                $"Arrange these {artworks.Count} artworks into {wallCount} wall groups. " +
                $"Keep similar works together.\n\nArtworks:\n{artworkList}\n\n" +
                "Respond with JSON: " +
                "{\"curatorNote\": \"...\", \"placements\": " +
                "[{\"artworkId\": \"id\", \"wallGroup\": 0, \"orderWithinGroup\": 0}]}";

            var raw = await CallGeminiText(prompt);
            return ParseArrangementResponse(raw, artworks, wallCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI arrangement failed — using fallback");
            return FallbackArrangement(artworks, wallCount);
        }
    }

    // ── Structured Arrangement ────────────────────────────────────────────────

    public async Task<string> GetStructuredArrangementAsync(string prompt)
    {
        try
        {
            if (IsApiKeyMissing()) return "{\"explanation\": \"Artworks arranged.\", \"placements\": []}";
            return await CallGeminiText("You are an expert art curator. Respond ONLY with valid JSON. No markdown.\n\n" + prompt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate structured arrangement");
            return "{\"explanation\": \"Artworks arranged.\", \"placements\": []}";
        }
    }

    // ── Completion ────────────────────────────────────────────────────────────

    public async Task<string> GetCompletionAsync(string systemPrompt, string userMessage)
    {
        try
        {
            return await CallGeminiText(systemPrompt + "\n\n" + userMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini API call failed");
            return "I'm sorry, I couldn't generate content at this time.";
        }
    }

    // ── Analyze Artwork Image (visual metadata) ───────────────────────────────

    public async Task<ArtworkVisualAnalysis> AnalyzeArtworkImageAsync(
        string imageUrl, string title, string artworkType, string? description)
    {
        try
        {
            _logger.LogInformation("Analyzing artwork image: {Title}", title);

            try
            {
                var hfAnalysis = await _huggingFace.AnalyzeArtworkVisualsAsync(imageUrl, title, artworkType);
                if (hfAnalysis != null) return hfAnalysis;
            }
            catch (Exception hfEx)
            {
                _logger.LogWarning(hfEx, "HuggingFace analysis failed, falling back to Gemini");
            }

            if (IsApiKeyMissing()) return InferFromMetadata(title, artworkType, description);

            try
            {
                var prompt = $"Analyze this artwork: \"{title}\" ({artworkType})" +
                    (description != null ? $". Description: {description}" : "") +
                    "\n\nRespond with ONLY this JSON:\n" +
                    "{\"colorMood\": \"warm|cool|neutral|dark|bright\", " +
                    "\"visualStyle\": \"abstract|realism|impressionism|contemporary|classical|surrealism\", " +
                    "\"subject\": \"portrait|landscape|still_life|abstract|urban|nature\", " +
                    "\"mood\": \"calm|energetic|melancholic|joyful|dramatic|serene\", " +
                    "\"dominantColors\": \"color1,color2,color3\"}";

                var raw = await CallGeminiVision(imageUrl, prompt);
                return ParseVisualAnalysis(raw);
            }
            catch (Exception visionEx)
            {
                _logger.LogWarning(visionEx, "Gemini Vision failed for {Title}, using text inference", title);
                return await InferFromTextAsync(title, artworkType, description);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image analysis failed for {Title}", title);
            return InferFromMetadata(title, artworkType, description);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<List<string>> SuggestTitlesFromImageAsync(
        string imageUrl, string? artworkType, string? materials, string? additionalContext)
    {
        try
        {
            var prompt = $"Look at this artwork (Type: {artworkType ?? "unknown"}, " +
                $"Materials: {materials ?? "unknown"}" +
                (additionalContext != null ? $", Context: {additionalContext}" : "") + ").\n\n" +
                "Suggest 5 creative, evocative titles that capture the visual essence, " +
                "mood, and subject of this artwork.\n\n" +
                "Return ONLY a JSON array: [\"Title 1\", \"Title 2\", \"Title 3\", \"Title 4\", \"Title 5\"]";

            var raw    = await CallGeminiVision(imageUrl, prompt);
            var titles = ParseTitleSuggestions(raw);
            return titles.Count > 0 ? titles : GetMockTitles();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini Vision title suggestion failed, falling back to text");
            return await SuggestTitlesTextOnlyAsync(artworkType, materials, additionalContext);
        }
    }

    private async Task<List<string>> SuggestTitlesTextOnlyAsync(
        string? artworkType, string? materials, string? additionalContext)
    {
        try
        {
            var prompt = "You are a creative art title generator. Suggest 5 unique, evocative titles. " +
                "Return ONLY a JSON array: [\"Title 1\", \"Title 2\", \"Title 3\", \"Title 4\", \"Title 5\"]\n\n" +
                $"Generate 5 creative artwork titles. " +
                $"Type: {artworkType ?? "unknown"}. Materials: {materials ?? "unknown"}. " +
                (additionalContext != null ? $"Context: {additionalContext}." : "");

            var response = await CallGeminiText(prompt);
            return ParseTitleSuggestions(response);
        }
        catch { return GetMockTitles(); }
    }

    private async Task<ArtworkVisualAnalysis> InferFromTextAsync(
        string title, string artworkType, string? description)
    {
        var prompt = "You are an art expert. Infer visual properties from metadata. Respond ONLY with valid JSON.\n\n" +
            $"Infer visual properties for: \"{title}\" ({artworkType})" +
            (description != null ? $". Description: {description}" : "") +
            "\n\nRespond with ONLY this JSON:\n" +
            "{\"colorMood\": \"warm|cool|neutral|dark|bright\", " +
            "\"visualStyle\": \"abstract|realism|impressionism|contemporary|classical|surrealism\", " +
            "\"subject\": \"portrait|landscape|still_life|abstract|urban|nature\", " +
            "\"mood\": \"calm|energetic|melancholic|joyful|dramatic|serene\", " +
            "\"dominantColors\": \"color1,color2,color3\"}";

        var raw = await CallGeminiText(prompt);
        return ParseVisualAnalysis(raw);
    }

    private async Task<string> CallGeminiText(string prompt)
    {
        var body = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { temperature = 0.7, maxOutputTokens = 800 }
        };

        var url = $"{GeminiTextUrl}?key={_settings.ApiKey}";
        var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Content = JsonContent(body);

        var res = await _httpClient.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            _logger.LogError("Gemini error {Status}: {Error}", res.StatusCode, err);
            res.EnsureSuccessStatusCode();
        }

        return ExtractGeminiContent(await res.Content.ReadAsStringAsync());
    }

    private async Task<string> CallGeminiVision(string imageUrl, string prompt)
    {
        object imagePart;

        if (imageUrl.StartsWith("data:"))
        {
            var commaIdx  = imageUrl.IndexOf(',');
            var mimeType  = imageUrl[5..imageUrl.IndexOf(';')];
            var base64Data = imageUrl[(commaIdx + 1)..];
            imagePart = new { inlineData = new { mimeType, data = base64Data } };
        }
        else
        {
            imagePart = new { fileData = new { mimeType = "image/jpeg", fileUri = imageUrl } };
        }

        var body = new
        {
            contents = new[] { new { parts = new object[] { imagePart, new { text = prompt } } } },
            generationConfig = new { temperature = 0.4, maxOutputTokens = 600 }
        };

        var url = $"{GeminiVisionUrl}?key={_settings.ApiKey}";
        var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Content = JsonContent(body);

        var res = await _httpClient.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            _logger.LogError("Gemini Vision error {Status}: {Error}", res.StatusCode, err);
            res.EnsureSuccessStatusCode();
        }

        return ExtractGeminiContent(await res.Content.ReadAsStringAsync());
    }

    private static string ExtractGeminiContent(string json)
    {
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "No content generated.";
    }

    private static List<string> ParseTitleSuggestions(string response)
    {
        try
        {
            var json  = response.Trim();
            var start = json.IndexOf('[');
            var end   = json.LastIndexOf(']');
            if (start >= 0 && end > start) json = json[start..(end + 1)];

            var suggestions = JsonSerializer.Deserialize<List<string>>(json);
            if (suggestions?.Count > 0) return suggestions.Take(5).ToList();
        }
        catch { }
        return GetMockTitles();
    }

    private static ArtworkVisualAnalysis ParseVisualAnalysis(string raw)
    {
        try
        {
            var json = StripMarkdown(raw);
            using var doc  = JsonDocument.Parse(json);
            var root = doc.RootElement;
            return new ArtworkVisualAnalysis(
                ColorMood:      GetProp(root, "colorMood",      "neutral"),
                VisualStyle:    GetProp(root, "visualStyle",    "contemporary"),
                Subject:        GetProp(root, "subject",        "abstract"),
                Mood:           GetProp(root, "mood",           "calm"),
                DominantColors: GetProp(root, "dominantColors", "neutral")
            );
        }
        catch
        {
            return new ArtworkVisualAnalysis("neutral", "contemporary", "abstract", "calm", "neutral");
        }
    }

    private static GalleryArrangementResult ParseArrangementResponse(
        string raw, List<ArtworkForArrangementInput> artworks, int wallCount)
    {
        try
        {
            var json = StripMarkdown(raw);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var note = root.TryGetProperty("curatorNote", out var n)
                ? n.GetString() ?? "Artworks grouped." : "Artworks grouped.";
            var placements = new List<ArtworkPlacement>();
            var seen = new HashSet<string>();

            if (root.TryGetProperty("placements", out var arr))
            {
                foreach (var item in arr.EnumerateArray())
                {
                    var id    = item.GetProperty("artworkId").GetString() ?? "";
                    var group = Math.Clamp(item.GetProperty("wallGroup").GetInt32(), 0, wallCount - 1);
                    var order = item.TryGetProperty("orderWithinGroup", out var o) ? o.GetInt32() : 0;
                    if (!string.IsNullOrEmpty(id) && artworks.Any(a => a.Id == id) && seen.Add(id))
                        placements.Add(new ArtworkPlacement(id, group, order));
                }
            }

            var i = 0;
            foreach (var a in artworks.Where(a => !seen.Contains(a.Id)))
                placements.Add(new ArtworkPlacement(a.Id, i++ % wallCount, placements.Count));

            return new GalleryArrangementResult(placements, note);
        }
        catch { return FallbackArrangement(artworks, wallCount); }
    }

    private static ArtworkVisualAnalysis InferFromMetadata(
        string title, string artworkType, string? description)
    {
        var text = $"{title} {artworkType} {description}".ToLower();

        var colorMood = text.Contains("dark") || text.Contains("night")     ? "dark"
                      : text.Contains("bright") || text.Contains("vibrant") ? "bright"
                      : text.Contains("warm") || text.Contains("sun")       ? "warm"
                      : text.Contains("cool") || text.Contains("blue")      ? "cool"
                      : "neutral";

        var style = artworkType.ToLower() switch
        {
            "digital"     => "contemporary",
            "sculpture"   => "classical",
            "photography" => "realism",
            "drawing"     => "realism",
            "print"       => "contemporary",
            _             => text.Contains("abstract") ? "abstract" : "realism"
        };

        var subject = text.Contains("portrait") || text.Contains("face")       ? "portrait"
                    : text.Contains("landscape") || text.Contains("nature")    ? "landscape"
                    : text.Contains("city") || text.Contains("urban")          ? "urban"
                    : "abstract";

        var mood = text.Contains("calm") || text.Contains("peace")     ? "serene"
                 : text.Contains("energy") || text.Contains("dynamic") ? "energetic"
                 : text.Contains("sad") || text.Contains("lonely")     ? "melancholic"
                 : "calm";

        return new ArtworkVisualAnalysis(colorMood, style, subject, mood, "neutral");
    }

    private static GalleryArrangementResult FallbackArrangement(
        List<ArtworkForArrangementInput> artworks, int wallCount)
    {
        var placements = artworks
            .GroupBy(a => a.ArtworkType)
            .SelectMany((g, gi) => g.Select((a, oi) => new ArtworkPlacement(a.Id, gi % wallCount, oi)))
            .ToList();
        return new GalleryArrangementResult(placements, "Artworks arranged by type.");
    }

    private static string BuildDescriptionPrompt(
        string title, string artworkType, string? materials, string? additionalContext)
    {
        var sb = new StringBuilder();
        sb.Append($"Generate a description for an artwork titled \"{title}\". Type: {artworkType}. ");
        if (!string.IsNullOrEmpty(materials))         sb.Append($"Materials: {materials}. ");
        if (!string.IsNullOrEmpty(additionalContext)) sb.Append($"Additional context: {additionalContext}. ");
        sb.Append("The description should be poetic, evocative, and focus on emotional impact.");
        return sb.ToString();
    }

    private static string GetMockDescription(string title, string artworkType, string? materials)
    {
        var r = new Random();
        string[] list =
        [
            $"A captivating {artworkType} titled '{title}' that draws viewers into a world of emotion.",
            $"'{title}' showcases mastery of {materials ?? "various materials"}, inviting contemplation.",
            $"This {artworkType} evokes wonder through texture and depth.",
            $"The use of {materials ?? "light and shadow"} in '{title}' creates a mesmerizing experience.",
            $"'{title}' captures a fleeting moment with extraordinary sensitivity.",
        ];
        return list[r.Next(list.Length)];
    }

    private static string GetMockInspiration(string artistBio, string preferredStyle, int n)
    {
        string[] ideas =
        [
            $"A series exploring urban architecture using {preferredStyle}.",
            $"Portraits capturing emotional isolation in {preferredStyle}.",
            $"Abstract interpretations of sound waves in {preferredStyle} style.",
            $"A study of light through translucent materials inspired by {artistBio}.",
            $"Sculptural pieces combining found objects, reflecting {preferredStyle}.",
        ];
        return string.Join("\n\n", ideas.Take(n));
    }

    private static List<string> GetMockTitles() =>
    [
        "Whispers of the Forgotten",
        "Echoes in the Silence",
        "Where Light Meets Shadow",
        "A Moment Suspended in Time",
        "The Color of Memory",
    ];

    private static string StripMarkdown(string raw)
    {
        var json = raw.Trim();
        if (json.StartsWith("```"))
            json = string.Join('\n', json.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")));
        var start = json.IndexOf('{');
        var end   = json.LastIndexOf('}');
        return start >= 0 && end > start ? json[start..(end + 1)] : json;
    }

    private static string GetProp(JsonElement root, string key, string fallback) =>
        root.TryGetProperty(key, out var el) ? el.GetString() ?? fallback : fallback;

    private static StringContent JsonContent(object body) =>
        new(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

    private bool IsApiKeyMissing() =>
        string.IsNullOrEmpty(_settings.ApiKey)      ||
        _settings.ApiKey.Contains("REPLACE")        ||
        _settings.ApiKey.Contains("placeholder");

    private static string Truncate(string? text, int max) =>
        string.IsNullOrWhiteSpace(text) ? "no description"
            : text.Length <= max ? text : text[..max] + "…";
}