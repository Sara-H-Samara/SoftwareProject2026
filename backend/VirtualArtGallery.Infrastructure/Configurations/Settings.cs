namespace VirtualArtGallery.Infrastructure.Configurations;

/// <summary>Azure Blob Storage configuration bound from "CloudStorageSettings".</summary>
public class CloudStorageSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty; // e.g. https://myaccount.blob.core.windows.net
}

/// <summary>Email service configuration bound from "EmailSettings".</summary>
public class EmailSettings
{
    public string Provider { get; set; } = "SendGrid"; // "SendGrid" | "MailKit"
    public string ApiKey { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@virtualartgallery.com";
    public string FromName { get; set; } = "Virtual Art Gallery";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
}

/// <summary>Azure OpenAI / OpenAI configuration bound from "OpenAISettings".</summary>
public class OpenAISettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;   // Azure: https://<resource>.openai.azure.com/
    public string DeploymentName { get; set; } = "gpt-4o"; // Azure deployment or OpenAI model name
    public bool UseAzure { get; set; } = true;
}
