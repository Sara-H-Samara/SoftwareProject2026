namespace VirtualArtGallery.Core.Interfaces;

/// <summary>
/// Abstraction for sending transactional emails.
/// Implement with SendGrid, MailKit, or any SMTP provider in Infrastructure.
/// </summary>
public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmationLink);
    Task SendPasswordResetAsync(string toEmail, string userName, string resetLink);
    Task SendWelcomeEmailAsync(string toEmail, string userName);
    Task SendNotificationEmailAsync(string toEmail, string subject, string htmlBody);
}
