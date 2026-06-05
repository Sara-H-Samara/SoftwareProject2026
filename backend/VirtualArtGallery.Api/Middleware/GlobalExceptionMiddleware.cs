using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace VirtualArtGallery.Api.Middleware;

/// <summary>
/// Catches any unhandled exceptions bubbling up from controllers/services
/// and converts them into a consistent RFC 7807 ProblemDetails JSON response.
/// This prevents stack traces from leaking to the client in production.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var problem = exception switch
        {
            // Map specific exception types to HTTP status codes
            UnauthorizedAccessException => new ProblemDetails
            {
                Status = (int)HttpStatusCode.Unauthorized,
                Title = "Unauthorized",
                Detail = "You are not authorized to perform this action."
            },
            KeyNotFoundException => new ProblemDetails
            {
                Status = (int)HttpStatusCode.NotFound,
                Title = "Not Found",
                Detail = exception.Message
            },
            ArgumentException or InvalidOperationException => new ProblemDetails
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Bad Request",
                Detail = exception.Message
            },
            _ => new ProblemDetails
            {
                Status = (int)HttpStatusCode.InternalServerError,
                Title = "Internal Server Error",
                // Only expose the real error message in Development
                Detail = _env.IsDevelopment()
                    ? $"{exception.Message}\n\n{exception.StackTrace}"
                    : "An unexpected error occurred. Please try again later."
            }
        };

        problem.Extensions["traceId"] = context.TraceIdentifier;
        problem.Instance = context.Request.Path;

        context.Response.StatusCode = problem.Status!.Value;

        var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

/// <summary>Extension method for clean registration in Program.cs.</summary>
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionMiddleware>();
}
