namespace VirtualArtGallery.Core.Interfaces;

public interface ICloudStorageService
{

    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string containerName);

    Task DeleteFileAsync(string fileUrl, string containerName);

    Task<string> GetSecureUrlAsync(string blobName, string containerName, int expiryMinutes = 60);
}
