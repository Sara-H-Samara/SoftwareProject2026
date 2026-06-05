using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Infrastructure.Services;

public class AzureBlobStorageService : ICloudStorageService
{
    private readonly CloudStorageSettings _settings;
    private readonly BlobServiceClient _blobServiceClient;

    public AzureBlobStorageService(IOptions<CloudStorageSettings> settings)
    {
        _settings = settings.Value;
        _blobServiceClient = new BlobServiceClient(_settings.ConnectionString);
    }

    public async Task<string> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string containerName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);

        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var uniqueFileName = $"{Path.GetFileNameWithoutExtension(fileName)}_{DateTime.UtcNow.Ticks}{Path.GetExtension(fileName)}";
        var blobClient = containerClient.GetBlobClient(uniqueFileName);

        var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };

        await blobClient.UploadAsync(fileStream, new BlobUploadOptions
        {
            HttpHeaders = blobHttpHeaders
        });

        return blobClient.Uri.ToString();
    }

    public async Task DeleteFileAsync(string fileUrl, string containerName)
    {
        var uri = new Uri(fileUrl);
        var blobName = uri.Segments.Last();

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
    }

    public Task<string> GetSecureUrlAsync(string blobName, string containerName, int expiryMinutes = 60)
    {
       
        var url = $"{_settings.BaseUrl}/{containerName}/{blobName}";
        return Task.FromResult(url);
    }
}
