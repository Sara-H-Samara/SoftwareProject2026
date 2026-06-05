// VirtualArtGallery.Api/Hubs/UserIdProvider.cs
using Microsoft.AspNetCore.SignalR;

namespace VirtualArtGallery.Api.Hubs;

/// <summary>
/// Tells SignalR to use the "userId" JWT claim as the user identifier
/// instead of the default NameIdentifier claim.
/// </summary>
public class UserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        // Try custom "userId" claim first (how this app issues tokens)
        var userId = connection.User?.FindFirst("userId")?.Value;
        if (!string.IsNullOrEmpty(userId)) return userId;

        // Fallback to standard NameIdentifier
        return connection.User?.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}