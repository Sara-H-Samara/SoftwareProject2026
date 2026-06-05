namespace VirtualArtGallery.Application.DTOs.Orders;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public class CreateCheckoutSessionRequest
{
    public List<CartItemDto> Items { get; set; } = new();
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class CartItemDto
{
    public string ArtworkId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class CreateOrderRequest
{
    public string StripeSessionId { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public List<OrderItemRequest> Items { get; set; } = new();
}

public class OrderItemRequest
{
    public string ArtworkId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string ArtistName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

public class OrderDto
{
    public Guid Id { get; set; }
    public string StripeSessionId { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public string ArtworkId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string ArtistName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}