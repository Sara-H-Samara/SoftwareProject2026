using System;
using System.Collections.Generic;

namespace VirtualArtGallery.Core.Entities;

public class Order
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string StripeSessionId { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty; // pending, completed, failed, refunded
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // Order Items (for storing purchased artworks)
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    
    public ApplicationUser? User { get; set; }
}