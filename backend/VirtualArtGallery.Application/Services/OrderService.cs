// Application/Services/OrderService.cs
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Orders;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Infrastructure.Data;

namespace VirtualArtGallery.Application.Services;

public class OrderService
{
    private readonly ApplicationDbContext _context;

    public OrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDto>> CreateOrderAsync(string userId, CreateOrderRequest request)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StripeSessionId = request.StripeSessionId,
            TotalAmount = request.TotalAmount,
            Status = "completed",
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        foreach (var item in request.Items)
        {
            // ✅ FIX: ArtworkId في OrderItem الآن Guid
            // نحوّل الـ string القادم من الـ request إلى Guid
            // إذا القيمة مش valid Guid نستخدم Guid.Empty كـ fallback
            var artworkId = Guid.TryParse(item.ArtworkId, out var parsedId)
                ? parsedId
                : Guid.Empty;

            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ArtworkId = artworkId,
                Title = item.Title,
                ImageUrl = item.ImageUrl,
                ArtistName = item.ArtistName,
                Price = item.Price,
                Quantity = item.Quantity
            };
            _context.OrderItems.Add(orderItem);
        }

        await _context.SaveChangesAsync();

        var createdOrder = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        return Result<OrderDto>.Success(MapToDto(createdOrder!));
    }

    public async Task<Result<List<OrderDto>>> GetUserOrdersAsync(string userId)
    {
        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Include(o => o.Items)
            .ToListAsync();

        return Result<List<OrderDto>>.Success(orders.Select(MapToDto).ToList());
    }

    public async Task<Result<OrderDto>> GetOrderByIdAsync(Guid orderId, string userId)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            return Result<OrderDto>.NotFound("Order not found");

        return Result<OrderDto>.Success(MapToDto(order));
    }

    public async Task<OrderDto?> GetOrderBySessionIdAsync(string stripeSessionId)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.StripeSessionId == stripeSessionId);

        return order == null ? null : MapToDto(order);
    }

    private static OrderDto MapToDto(Order order)
    {
        var items = order.Items?.Select(i => new OrderItemDto
        {
            Id = i.Id,
            // ✅ FIX: نحوّل Guid إلى string للـ DTO
            ArtworkId = i.ArtworkId.ToString(),
            Title = i.Title ?? string.Empty,
            ImageUrl = i.ImageUrl ?? string.Empty,
            ArtistName = i.ArtistName ?? "Unknown Artist",
            Price = i.Price,
            Quantity = i.Quantity
        }).ToList() ?? new List<OrderItemDto>();

        return new OrderDto
        {
            Id = order.Id,
            StripeSessionId = order.StripeSessionId ?? string.Empty,
            TotalAmount = order.TotalAmount,
            Status = order.Status ?? "pending",
            CreatedAt = order.CreatedAt,
            CompletedAt = order.CompletedAt,
            Items = items
        };
    }
}