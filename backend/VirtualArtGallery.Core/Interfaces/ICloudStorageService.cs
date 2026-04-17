namespace VirtualArtGallery.Core.Interfaces;

/// <summary>
/// Abstraction for cloud file storage operations.
/// Implemented by AzureBlobStorageService in Infrastructure.
/// </summary>
public interface ICloudStorageService
{
    /// <summary>
    /// Uploads a file stream to a specified container/folder.
    /// Returns the public URL of the uploaded file.
    /// </summary>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string containerName);

    /// <summary>
    /// Deletes a file by its full URL or blob name.
    /// </summary>
    Task DeleteFileAsync(string fileUrl, string containerName);

    /// <summary>
    /// Generates a short-lived SAS URL for private blob access (optional).
    /// </summary>
    Task<string> GetSecureUrlAsync(string blobName, string containerName, int expiryMinutes = 60);
}
