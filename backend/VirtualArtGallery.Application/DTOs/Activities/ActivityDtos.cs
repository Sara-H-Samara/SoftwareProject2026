// Application/DTOs/Activities/ActivityDto.cs
using System;

namespace VirtualArtGallery.Application.DTOs.Activities;

public record ActivityDto(
    Guid Id,
    string Type,
    string? ActorId,
    string? ActorName,
    string? ActorAvatar,
    string? ActorUserType,  
    Guid? EntityId,
    string? EntityTitle,
    string? EntityImage,
    string? Message,
    DateTime CreatedAt
);

public record ActivityFeedResponseDto(
    List<ActivityDto> Activities,
    int TotalCount,
    int Page,
    int PageSize,
    bool HasNextPage
);