using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using VirtualArtGallery.Core.Constants;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Infrastructure.Services;

/// <summary>
/// Implements IAzureOpenAIService using HttpClient directly to avoid SDK compatibility issues.
/// Supports both Azure-hosted deployments and direct OpenAI API.
/// </summary>
public class AzureOpenAIService : IAzureOpenAIService
{
    private readonly OpenAISettings _settings;
    private readonly ILogger<AzureOpenAIService> _logger;
    private readonly HttpClient _httpClient;

    public AzureOpenAIService(
        IOptions<OpenAISettings> settings, 
        ILogger<AzureOpenAIService> logger,
        HttpClient httpClient)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClient = httpClient;
    }

    /// <inheritdoc />
    public async Task<string> GenerateArtworkDescriptionAsync(
        string title, string artworkType, string? materials, string? additionalContext)
    {
        try
        {
            _logger.LogInformation("Generating description for artwork: {Title}", title);

            // التحقق من وجود API Key
            if (string.IsNullOrEmpty(_settings.ApiKey) || 
                _settings.ApiKey.Contains("REPLACE") || 
                _settings.ApiKey.Contains("placeholder"))
            {
                _logger.LogWarning("OpenAI API key is missing or invalid, returning mock response");
                return GetMockDescription(title, artworkType, materials);
            }

            var systemPrompt = AppConstants.AiPrompts.ArtworkDescriptionSystem;
            var userPrompt = BuildArtworkDescriptionPrompt(title, artworkType, materials, additionalContext);

            var response = await GetCompletionAsync(systemPrompt, userPrompt);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate artwork description for {Title}", title);
            return GetMockDescription(title, artworkType, materials);
        }
    }

    /// <inheritdoc />
    public async Task<string> GenerateInspirationAsync(string artistBio, string preferredStyle, int numberOfIdeas = 3)
    {
        try
        {
            _logger.LogInformation("Generating inspiration ideas");

            if (string.IsNullOrEmpty(_settings.ApiKey) || 
                _settings.ApiKey.Contains("REPLACE") || 
                _settings.ApiKey.Contains("placeholder"))
            {
                return GetMockInspiration(artistBio, preferredStyle, numberOfIdeas);
            }

            var systemPrompt = AppConstants.AiPrompts.InspirationSystem;
            var userPrompt = $"Generate {numberOfIdeas} creative artwork ideas for an artist. " +
                             $"Bio: {artistBio}. Preferred style: {preferredStyle}. " +
                             $"Return each idea as a separate paragraph.";

            var response = await GetCompletionAsync(systemPrompt, userPrompt);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate inspiration");
            return GetMockInspiration(artistBio, preferredStyle, numberOfIdeas);
        }
    }

    /// <inheritdoc />
    public async Task<string> GetCompletionAsync(string systemPrompt, string userMessage)
    {
        try
        {
            if (_settings.UseAzure)
            {
                return await CallAzureOpenAI(systemPrompt, userMessage);
            }
            else
            {
                return await CallOpenAI(systemPrompt, userMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI API call failed");
            return "I'm sorry, I couldn't generate content at this time. Please try again later.";
        }
    }

    private async Task<string> CallOpenAI(string systemPrompt, string userMessage)
    {
        var requestBody = new
        {
            model = _settings.DeploymentName ?? "gpt-3.5-turbo",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.7,
            max_tokens = 500
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {_settings.ApiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        
        var choice = doc.RootElement.GetProperty("choices")[0];
        var content = choice.GetProperty("message").GetProperty("content").GetString();

        return content ?? "No content generated.";
    }

    private async Task<string> CallAzureOpenAI(string systemPrompt, string userMessage)
    {
        var endpoint = $"{_settings.Endpoint.TrimEnd('/')}/openai/deployments/{_settings.DeploymentName}/chat/completions?api-version=2024-02-15-preview";
        
        var requestBody = new
        {
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.7,
            max_tokens = 500
        };

        var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Add("api-key", _settings.ApiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Azure OpenAI error: {StatusCode} - {Error}", response.StatusCode, errorContent);
            response.EnsureSuccessStatusCode();
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        
        var choice = doc.RootElement.GetProperty("choices")[0];
        var content = choice.GetProperty("message").GetProperty("content").GetString();

        return content ?? "No content generated.";
    }

    private string BuildArtworkDescriptionPrompt(string title, string artworkType, string? materials, string? additionalContext)
    {
        var prompt = $"Generate a description for an artwork titled \"{title}\". " +
                     $"Type: {artworkType}. ";

        if (!string.IsNullOrEmpty(materials))
            prompt += $"Materials: {materials}. ";

        if (!string.IsNullOrEmpty(additionalContext))
            prompt += $"Additional context: {additionalContext}. ";

        prompt += "The description should be poetic, evocative, and focus on the emotional impact and visual elements.";

        return prompt;
    }

    private string GetMockDescription(string title, string artworkType, string? materials)
    {
        var random = new Random();
        var descriptions = new[]
        {
            $"A captivating {artworkType} titled '{title}' that draws viewers into a world of emotion and light. The composition balances tension and harmony beautifully, creating a dialogue between form and space.",
            
            $"'{title}' is a stunning {artworkType} that showcases the artist's mastery of {(materials ?? "various materials")}. The work invites contemplation and rewards close inspection with subtle details.",
            
            $"This remarkable {artworkType} piece, '{title}', evokes a sense of wonder and contemplation. The artist's use of texture creates depth and movement across the surface.",
            
            $"The artist's use of {(materials ?? "light and shadow")} in '{title}' creates a mesmerizing visual experience. The composition draws the eye on a journey through layers of meaning.",
            
            $"'{title}' captures a fleeting moment with extraordinary sensitivity. The {artworkType} format allows the artist to explore the boundaries between abstraction and representation."
        };

        return descriptions[random.Next(descriptions.Length)];
    }

    private string GetMockInspiration(string artistBio, string preferredStyle, int numberOfIdeas)
    {
        var ideas = new[]
        {
            $"A series exploring the relationship between urban architecture and natural forms, using {preferredStyle} to create tension and harmony.",
            
            $"Portraits that capture the emotional landscape of isolation in the digital age, rendered in {preferredStyle} with soft, ethereal qualities.",
            
            $"An abstract interpretation of sound waves and music, using vibrant colors and dynamic brushstrokes in {preferredStyle} style.",
            
            $"A study of light through layered translucent materials, creating ever-changing compositions inspired by {artistBio}.",
            
            $"Sculptural pieces that combine found objects with traditional materials, commenting on consumer culture through {preferredStyle}."
        };

        return string.Join("\n\n", ideas.Take(numberOfIdeas));
    }
}