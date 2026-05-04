using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Infrastructure.Services;

/// <summary>
/// Placeholder email service. 
/// 
/// To use SendGrid: install SendGrid NuGet package and replace TODO blocks.
/// To use MailKit: install MailKit NuGet package and configure SMTP in EmailSettings.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmationLink)
    {
        var subject = "Confirm your Virtual Art Gallery account";
        var htmlBody = $@"
            <h2>Welcome to Virtual Art Gallery, {userName}!</h2>
            <p>Please confirm your email address by clicking the link below:</p>
            <a href='{confirmationLink}' style='background:#6366f1;color:white;padding:12px 24px;
               text-decoration:none;border-radius:6px;'>Confirm Email</a>
            <p>This link expires in 24 hours.</p>";

        await SendAsync(toEmail, subject, htmlBody);
    }

    public async Task SendPasswordResetAsync(string toEmail, string userName, string resetLink)
    {
        var subject = "Reset your Virtual Art Gallery password";
        var htmlBody = $@"
            <h2>Password Reset Request</h2>
            <p>Hi {userName}, we received a request to reset your password.</p>
            <a href='{resetLink}' style='background:#6366f1;color:white;padding:12px 24px;
               text-decoration:none;border-radius:6px;'>Reset Password</a>
            <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>";

        await SendAsync(toEmail, subject, htmlBody);
    }

public Task SendNotificationEmailAsync(string toEmail, string subject, string htmlBody)
{
    _logger.LogInformation("[Notification Email] To: {To}, Subject: {Subject}", toEmail, subject);
    // يمكنك هنا استخدام نفس طريقة SendViaSmtpAsync أو SendGrid
    return SendViaSmtpAsync(toEmail, subject, htmlBody);
}


    public async Task SendWelcomeEmailAsync(string toEmail, string userName)
    {
        var subject = "Welcome to Virtual Art Gallery!";
        var htmlBody = $@"
            <h2>Your gallery is ready, {userName}!</h2>
            <p>Start by uploading your first artwork and arranging your 3D gallery space.</p>";

        await SendAsync(toEmail, subject, htmlBody);
    }

    // ── Private Helpers ────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (_settings.Provider == "SendGrid")
        {
            await SendViaSendGridAsync(toEmail, subject, htmlBody);
        }
        else
        {
            await SendViaSmtpAsync(toEmail, subject, htmlBody);
        }
    }

    private Task SendViaSendGridAsync(string toEmail, string subject, string htmlBody)
    {
        // TODO: Install SendGrid NuGet: dotnet add package SendGrid
        // var client = new SendGridClient(_settings.ApiKey);
        // var msg = MailHelper.CreateSingleEmail(
        //     new EmailAddress(_settings.FromEmail, _settings.FromName),
        //     new EmailAddress(toEmail),
        //     subject, null, htmlBody);
        // await client.SendEmailAsync(msg);

        _logger.LogInformation("[SendGrid STUB] Sending '{Subject}' to {Email}", subject, toEmail);
        return Task.CompletedTask;
    }

    private async Task SendViaSmtpAsync(string toEmail, string subject, string htmlBody)
{
    using var smtp = new System.Net.Mail.SmtpClient
    {
        Host = _settings.SmtpHost,
        Port = _settings.SmtpPort,
        EnableSsl = true,
        Credentials = new System.Net.NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword)
    };

    var mailMessage = new System.Net.Mail.MailMessage
    {
        From = new System.Net.Mail.MailAddress(_settings.FromEmail, _settings.FromName),
        Subject = subject,
        Body = htmlBody,
        IsBodyHtml = true
    };
    mailMessage.To.Add(toEmail);

    await smtp.SendMailAsync(mailMessage);
    _logger.LogInformation("✅ Email sent successfully to {Email}", toEmail);
}
}
