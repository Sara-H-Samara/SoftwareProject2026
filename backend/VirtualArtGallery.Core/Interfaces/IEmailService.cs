public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    Task SendWelcomeEmailAsync(string email, string name);
    Task SendEmailConfirmationAsync(string email, string name, string confirmationLink);
    Task SendPasswordResetAsync(string email, string name, string resetLink);
    Task SendNotificationEmailAsync(string email, string name, string type, string message, string link = "");
}