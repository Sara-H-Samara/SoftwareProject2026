namespace VirtualArtGallery.Application.DTOs.Notifications;

public class UserNotificationSettingsDto
{
    public bool EmailLikes { get; set; }
    public bool EmailFollows { get; set; }
    public bool EmailComments { get; set; }
    public bool EmailReviews { get; set; }
}

public class UpdateNotificationSettingsRequest
{
    public bool EmailLikes { get; set; }
    public bool EmailFollows { get; set; }
    public bool EmailComments { get; set; }
    public bool EmailReviews { get; set; }
}