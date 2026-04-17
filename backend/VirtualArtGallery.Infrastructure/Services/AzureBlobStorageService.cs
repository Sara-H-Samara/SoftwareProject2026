using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Options;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Infrastructure.Services;

/// <summary>
/// Implements ICloudStorageService using Azure Blob Storage SDK.
/// All artwork images and profile pictures are stored as publicly-accessible blobs.
/// 
/// Prerequisites:
///   - Azure Storage Account with two containers created:
///     "artwork-images" and "profile-pictures" (both set to public read access for images)
///   - Connection string set in CloudStorageSettings.ConnectionString
/// </summary>
public class AzureBlobStorageService : ICloudStorageService
{
    private readonly CloudStorageSettings _settings;
    private readonly BlobServiceClient _blobServiceClient;

    public AzureBlobStorageService(IOptions<CloudStorageSettings> settings)
    {
        _settings = settings.Value;
        _blobServiceClient = new BlobServiceClient(_settings.ConnectionString);
    }

    /// <inheritdoc />
    public async Task<string> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string containerName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);

        // Ensure container exists (idempotent)
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        // Append a timestamp to avoid name collisions
        var uniqueFileName = $"{Path.GetFileNameWithoutExtension(fileName)}_{DateTime.UtcNow.Ticks}{Path.GetExtension(fileName)}";
        var blobClient = containerClient.GetBlobClient(uniqueFileName);

        var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };

        await blobClient.UploadAsync(fileStream, new BlobUploadOptions
        {
            HttpHeaders = blobHttpHeaders
        });

        return blobClient.Uri.ToString();
    }

    /// <inheritdoc />
    public async Task DeleteFileAsync(string fileUrl, string containerName)
    {
        // Extract the blob name from the full URL
        var uri = new Uri(fileUrl);
        var blobName = uri.Segments.Last();

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
    }

    /// <inheritdoc />
    public Task<string> GetSecureUrlAsync(string blobName, string containerName, int expiryMinutes = 60)
    {
        // TODO: Implement SAS token generation for private blobs if needed.
        // For now, blobs are publicly accessible so we return the direct URL.
        var url = $"{_settings.BaseUrl}/{containerName}/{blobName}";
        return Task.FromResult(url);
    }
}
