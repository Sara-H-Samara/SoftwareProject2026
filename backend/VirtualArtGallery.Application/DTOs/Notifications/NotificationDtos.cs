using System;

namespace VirtualArtGallery.Application.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    string Type,
    string? TriggeredByUserId,
    string? TriggeredByName,
    Guid? EntityId,
    string? EntityTitle,
    string Message,
    bool IsRead,
    DateTime CreatedAt
);

public record UnreadCountDto(int Count);

public record MarkAsReadRequestDto(Guid NotificationId);