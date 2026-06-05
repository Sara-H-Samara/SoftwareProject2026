namespace VirtualArtGallery.Core.Interfaces;

public interface IHuggingFaceService
{
    Task<string> DescribeImageAsync(string imageBase64, string title, string artworkType);
    Task<List<string>> SuggestTitlesFromImageAsync(string imageBase64, string artworkType);
    Task<ArtworkVisualAnalysis> AnalyzeArtworkVisualsAsync(string imageBase64, string title, string artworkType);
}