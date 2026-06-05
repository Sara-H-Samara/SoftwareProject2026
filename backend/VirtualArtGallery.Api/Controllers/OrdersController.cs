using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Application.DTOs.Orders;
using VirtualArtGallery.Infrastructure.Data;
using VirtualArtGallery.Core.Entities;
using Stripe;
using Stripe.Checkout;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace VirtualArtGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : BaseApiController
{
    private readonly StripeService _stripeService;
    private readonly ApplicationDbContext _context;
    private readonly OrderService _orderService;
    private readonly VirtualArtGallery.Application.Services.InvoiceService _invoiceService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrdersController> _logger;
    private readonly IEmailService _emailService;

    public OrdersController(
        StripeService stripeService,
        ApplicationDbContext context,
        OrderService orderService,
        VirtualArtGallery.Application.Services.InvoiceService invoiceService,
        IConfiguration configuration,
        ILogger<OrdersController> logger,
        IEmailService emailService)
    {
        _stripeService = stripeService;
        _context = context;
        _orderService = orderService;
        _invoiceService = invoiceService;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
    }

    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request)
    {
        var userId = RequireCurrentUserId();
        
        var result = await _stripeService.CreateCheckoutSessionAsync(
            userId,
            request.Items,
            request.SuccessUrl,
            request.CancelUrl);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        if (result.Value == null)
            return StatusCode(500, new { error = "Failed to create checkout session" });

        return Ok(new { sessionId = result.Value.Id, url = result.Value.Url });
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = RequireCurrentUserId();
        
        var result = await _orderService.CreateOrderAsync(userId, request);
        
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        
        return Ok(result.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = RequireCurrentUserId();
        var result = await _orderService.GetUserOrdersAsync(userId);
        return ToActionResult(result);
    }

    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetOrderById(Guid orderId)
    {
        var userId = RequireCurrentUserId();
        var result = await _orderService.GetOrderByIdAsync(orderId, userId);
        return ToActionResult(result);
    }

    [HttpGet("{orderId}/invoice")]
    public async Task<IActionResult> DownloadInvoice(Guid orderId)
    {
        try
        {
            var userId = RequireCurrentUserId();
            var orderResult = await _orderService.GetOrderByIdAsync(orderId, userId);
            
            if (!orderResult.IsSuccess || orderResult.Value == null)
                return NotFound(new { error = orderResult.Error ?? "Order not found" });
            
            var order = orderResult.Value;
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found when generating invoice", userId);
                return NotFound(new { error = "User not found" });
            }
            
            var userName = user.DisplayName ?? user.Email ?? "User";
            var userEmail = user.Email ?? "";
            
            var html = _invoiceService.GenerateHtml(order, userName, userEmail);
            
            return Content(html, "text/html");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice for order {OrderId}", orderId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var stripeSignature = Request.Headers["Stripe-Signature"].ToString();
        
        var webhookSecret = _configuration["StripeSettings:WebhookSecret"];
        
        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogError("Stripe webhook secret is not configured");
            return BadRequest(new { error = "Webhook secret not configured" });
        }
        
        if (string.IsNullOrEmpty(stripeSignature))
        {
            _logger.LogWarning("Missing Stripe signature in webhook request");
            return BadRequest(new { error = "Missing Stripe signature" });
        }

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json,
                stripeSignature,
                webhookSecret);

            _logger.LogInformation("Stripe webhook received: {EventType} | {EventId}", 
                stripeEvent.Type, stripeEvent.Id);

            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                    await HandleCheckoutSessionCompleted(stripeEvent);
                    break;
                    
                case "checkout.session.expired":
                    _logger.LogInformation("Checkout session expired: {EventId}", stripeEvent.Id);
                    break;
                    
                case "payment_intent.payment_failed":
                    await HandlePaymentFailed(stripeEvent);
                    break;
                    
                default:
                    _logger.LogInformation("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return Ok(new { received = true, type = stripeEvent.Type });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook error: {Message}", ex.Message);
            return BadRequest(new { error = $"Webhook error: {ex.Message}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in Stripe webhook");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private async Task HandleCheckoutSessionCompleted(Event stripeEvent)
    {
        var session = stripeEvent.Data.Object as Session;
        if (session == null)
        {
            _logger.LogWarning("Failed to parse session from webhook event");
            return;
        }
        
        if (!session.Metadata.TryGetValue("userId", out var userId) || string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("No userId found in session metadata for session {SessionId}", session.Id);
            return;
        }
        
        _logger.LogInformation("Processing completed checkout for user {UserId}, session {SessionId}", 
            userId, session.Id);
        
        var existingOrder = await _orderService.GetOrderBySessionIdAsync(session.Id);
        if (existingOrder != null)
        {
            _logger.LogInformation("Order already exists for session {SessionId}, skipping", session.Id);
            return;
        }
        
        var items = new List<OrderItemRequest>();
        
        try
        {
            var lineItemsService = new Stripe.Checkout.SessionLineItemService();
            var lineItems = await lineItemsService.ListAsync(session.Id);
            
            foreach (var item in lineItems.Data)
            {
                items.Add(new OrderItemRequest
                {
                    ArtworkId = item.Price?.Product?.Metadata?.GetValueOrDefault("artworkId") ?? Guid.NewGuid().ToString(),
                    Title = item.Description ?? "Artwork",
                    ImageUrl = item.Price?.Product?.Metadata?.GetValueOrDefault("imageUrl") ?? "",
                    ArtistName = item.Price?.Product?.Metadata?.GetValueOrDefault("artistName") ?? "Unknown Artist",
                    Price = (decimal)(item.AmountTotal / 100m),
                    Quantity = (int)(item.Quantity ?? 1)
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not retrieve line items for session {SessionId}", session.Id);
        }
        
        var orderRequest = new CreateOrderRequest
        {
            StripeSessionId = session.Id,
            TotalAmount = (decimal)(session.AmountTotal ?? 0) / 100,
            Items = items
        };

        var result = await _orderService.CreateOrderAsync(userId, orderRequest);
        
        if (result.IsSuccess && result.Value != null)
        {
            _logger.LogInformation("Order created successfully for user {UserId}, order {OrderId}", 
                userId, result.Value.Id);
            
            await SendOrderConfirmationEmail(userId, result.Value);
        }
        else
        {
            _logger.LogError("Failed to create order for user {UserId}, session {SessionId}: {Error}", 
                userId, session.Id, result.Error);
        }
    }

    private async Task HandlePaymentFailed(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null) return;
        
        _logger.LogWarning("Payment failed for intent {IntentId}: {Error}", 
            paymentIntent.Id, paymentIntent.LastPaymentError?.Message);
    }

    private async Task SendOrderConfirmationEmail(string userId, OrderDto order)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.Email == null)
            {
                _logger.LogWarning("Cannot send order confirmation: User {UserId} not found or has no email", userId);
                return;
            }
            
            var subject = "Order Confirmation - Virtual Art Gallery";
            var body = $@"
                <h1>Thank you for your order!</h1>
                <p>Your order #{order.Id} has been confirmed.</p>
                <p>Total Amount: ${order.TotalAmount:F2}</p>
                <p>We will process your order shortly.</p>
            ";
            await _emailService.SendEmailAsync(user.Email, subject, body);
            _logger.LogInformation("Order confirmation email sent for order {OrderId}", order.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send order confirmation email for order {OrderId}", order.Id);
        }
    }
}