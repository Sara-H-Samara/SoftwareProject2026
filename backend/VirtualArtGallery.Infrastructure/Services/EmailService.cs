using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        try
        {
            using var client = new SmtpClient(_settings.SmtpServer, _settings.SmtpPort);
            client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
            client.EnableSsl = _settings.EnableSsl;

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Email sending failed: {ex.Message}");
        }
    }

    public async Task SendWelcomeEmailAsync(string email, string name)
    {
        var subject = "Welcome to Virtual Art Gallery!";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Welcome to Virtual Art Gallery</title>
            </head>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; margin-bottom: 30px;'>
                        <div style='width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;'>
                            <span style='color: white; font-size: 24px; font-weight: bold;'>V</span>
                        </div>
                        <h1 style='color: #333; margin-top: 15px;'>Virtual Art Gallery</h1>
                    </div>
                    <h2>Welcome, {name}!</h2>
                    <p>Thank you for joining Virtual Art Gallery. We're excited to have you on board!</p>
                    <p>Start exploring amazing artworks and connect with artists from around the world.</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='https://virtualartgallery.com/browse' style='background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>
                            Start Exploring
                        </a>
                    </div>
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;' />
                    <p style='color: #666; font-size: 12px; text-align: center;'>
                        © {DateTime.UtcNow.Year} Virtual Art Gallery. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
        ";
        await SendEmailAsync(email, subject, body);
    }

    public async Task SendEmailConfirmationAsync(string email, string name, string confirmationLink)
    {
        var subject = "Confirm Your Email - Virtual Art Gallery";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Confirm Your Email</title>
            </head>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; margin-bottom: 30px;'>
                        <div style='width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;'>
                            <span style='color: white; font-size: 24px; font-weight: bold;'>V</span>
                        </div>
                        <h1 style='color: #333; margin-top: 15px;'>Virtual Art Gallery</h1>
                    </div>
                    <h2>Confirm Your Email Address</h2>
                    <p>Hello {name},</p>
                    <p>Please confirm your email address to complete your registration:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{confirmationLink}' style='background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>
                            Confirm Email
                        </a>
                    </div>
                    <p>Or copy this link: {confirmationLink}</p>
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;' />
                    <p style='color: #666; font-size: 12px; text-align: center;'>
                        © {DateTime.UtcNow.Year} Virtual Art Gallery. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
        ";
        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetAsync(string email, string name, string resetLink)
    {
        var subject = "Reset Your Password - Virtual Art Gallery";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Reset Your Password</title>
            </head>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; margin-bottom: 30px;'>
                        <div style='width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;'>
                            <span style='color: white; font-size: 24px; font-weight: bold;'>V</span>
                        </div>
                        <h1 style='color: #333; margin-top: 15px;'>Virtual Art Gallery</h1>
                    </div>
                    <h2>Password Reset Request</h2>
                    <p>Hello {name},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{resetLink}' style='background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy this link: {resetLink}</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;' />
                    <p style='color: #666; font-size: 12px; text-align: center;'>
                        © {DateTime.UtcNow.Year} Virtual Art Gallery. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
        ";
        await SendEmailAsync(email, subject, body);
    }

    public async Task SendNotificationEmailAsync(string email, string name, string type, string message, string link = "")
    {
        var typeEmoji = type switch
        {
            "like" => "❤️",
            "follow" => "👥",
            "comment" => "💬",
            "review" => "⭐",
            _ => "🔔"
        };

        var typeName = type switch
        {
            "like" => "Like",
            "follow" => "Follow",
            "comment" => "Comment",
            "review" => "Review",
            _ => "Notification"
        };

        var subject = $"{typeEmoji} New {typeName} on Virtual Art Gallery";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>New {typeName} Notification</title>
            </head>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; margin-bottom: 30px;'>
                        <div style='width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;'>
                            <span style='color: white; font-size: 24px; font-weight: bold;'>V</span>
                        </div>
                        <h1 style='color: #333; margin-top: 15px;'>Virtual Art Gallery</h1>
                    </div>
                    
                    <h2>Hello {name},</h2>
                    
                    <div style='background: #f8f9fa; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0;'>
                        <p style='margin: 0; font-size: 16px;'>{message}</p>
                    </div>
                    
                    {(string.IsNullOrEmpty(link) ? "" : $@"
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{link}' style='background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>
                            View Details
                        </a>
                    </div>
                    ")}
                    
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;' />
                    <p style='color: #666; font-size: 12px; text-align: center;'>
                        You're receiving this email because you have notifications enabled.
                        <br/>
                        © {DateTime.UtcNow.Year} Virtual Art Gallery. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
        ";
        await SendEmailAsync(email, subject, body);
    }
}