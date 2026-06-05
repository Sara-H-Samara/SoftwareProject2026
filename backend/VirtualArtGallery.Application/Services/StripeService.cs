using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using VirtualArtGallery.Application.Common;
using VirtualArtGallery.Application.DTOs.Orders;  
using VirtualArtGallery.Infrastructure.Configurations;

namespace VirtualArtGallery.Application.Services;

public class StripeService
{
    private readonly StripeSettings _stripeSettings;

    public StripeService(IOptions<StripeSettings> stripeSettings)
    {
        _stripeSettings = stripeSettings.Value;
        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    public async Task<Result<Session>> CreateCheckoutSessionAsync(
        string userId,
        List<CartItemDto> items, 
        string successUrl,
        string cancelUrl)
    {
        try
        {
            var sessionOptions = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = items.Select(item => new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = (long)(item.Price * 100),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = item.Title,
                            Images = new List<string> { item.ImageUrl }
                        }
                    },
                    Quantity = item.Quantity
                }).ToList(),
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(sessionOptions);

            return Result<Session>.Success(session);
        }
        catch (StripeException ex)
        {
            return Result<Session>.Failure($"Stripe error: {ex.Message}");
        }
    }

    public async Task<Result<Session>> GetSessionAsync(string sessionId)
    {
        try
        {
            var service = new SessionService();
            var session = await service.GetAsync(sessionId);
            return Result<Session>.Success(session);
        }
        catch (StripeException ex)
        {
            return Result<Session>.Failure($"Stripe error: {ex.Message}");
        }
    }
}