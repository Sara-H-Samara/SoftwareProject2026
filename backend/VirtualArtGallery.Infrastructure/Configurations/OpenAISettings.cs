namespace VirtualArtGallery.Infrastructure.Configurations;

public class OpenAISettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string DeploymentName { get; set; } = "gpt-4o";
    public bool UseAzure { get; set; } = true;
    
    public string AzureSpeechKey { get; set; } = string.Empty;
    public string AzureSpeechEndpoint { get; set; } = string.Empty;
    public string ElevenLabsApiKey { get; set; } = string.Empty;
    public string VoiceRssKey { get; set; } = string.Empty;
}