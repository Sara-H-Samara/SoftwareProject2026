namespace VirtualArtGallery.Core.Constants;

/// <summary>
/// Application-wide constants. Centralizing these avoids magic strings scattered across the codebase.
/// </summary>
public static class AppConstants
{
    
    public static class BlobContainers
    {
        public const string ArtworkImages = "artwork-images";
        public const string ProfilePictures = "profile-pictures";
    }

    
    public static class Defaults
    {
        public const string ProfilePicUrl = "https://yourstorage.blob.core.windows.net/profile-pictures/default-avatar.png";
        public const string GalleryName = "My Virtual Gallery";
    }

    
    public static class JwtClaims
    {
        public const string UserId = "uid";
        public const string UserType = "user_type";
        public const string GalleryName = "gallery_name";
    }

   
    public static class Pagination
    {
        public const int DefaultPageSize = 12;
        public const int MaxPageSize = 50;
    }

    
    public static class FileUpload
    {
        public const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
        public static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        public static readonly string[] AllowedImageContentTypes = { "image/jpeg", "image/png", "image/webp", "image/gif" };
    }

    
    public static class AiPrompts
    {
        public const string ArtworkDescriptionSystem =
            "You are an expert art curator and writer. Generate evocative, professional descriptions " +
            "for artworks. Be concise (2-3 sentences), focus on mood, technique, and viewer experience.";

        public const string InspirationSystem =
            "You are a creative art mentor. Generate fresh, specific artwork ideas tailored to the " +
            "artist's style and medium. Be inspiring and actionable.";
    }
}
