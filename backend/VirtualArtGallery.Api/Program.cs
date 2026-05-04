using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VirtualArtGallery.Api.Middleware;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Application.Validators;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;
using VirtualArtGallery.Infrastructure.Data;
using VirtualArtGallery.Infrastructure.Services;
using Microsoft.EntityFrameworkCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Configuration binding ─────────────────────────────────────────────────
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

builder.Services.Configure<CloudStorageSettings>(
    builder.Configuration.GetSection("CloudStorageSettings"));

builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

builder.Services.Configure<OpenAISettings>(
    builder.Configuration.GetSection("OpenAISettings"));

// ── 2. Database (EF Core + SQL Server) ───────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.MigrationsAssembly("VirtualArtGallery.Infrastructure");
        })
        .ConfigureWarnings(warnings =>
        warnings.Ignore(RelationalEventId.MultipleCollectionIncludeWarning))
        );

// ── 3. ASP.NET Core Identity ─────────────────────────────────────────────────
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;

    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// ── 4. JWT Authentication ─────────────────────────────────────────────────────
var jwtSettings = builder.Configuration
    .GetSection("JwtSettings")
    .Get<JwtSettings>()!;

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    "{\"error\":\"Authentication required. Please provide a valid Bearer token.\"}");
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    "{\"error\":\"You do not have permission to access this resource.\"}");
            }
        };
    });

// ── 5. Authorization Policies ─────────────────────────────────────────────────
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("ArtistOnly", policy => policy.RequireRole("Artist"))
    .AddPolicy("VisitorOrAbove", policy => policy.RequireAuthenticatedUser());

// ── 6. Infrastructure Services (DI Registration) ────────────────────────────
builder.Services.AddScoped<ICloudStorageService, AzureBlobStorageService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAzureOpenAIService, AzureOpenAIService>();

// ✅ 6.1 HTTP Client for AI Service
builder.Services.AddHttpClient<IAzureOpenAIService, AzureOpenAIService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "VirtualArtGallery");
});

// ── 7. Application Services ───────────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ArtworkService>();
builder.Services.AddScoped<GalleryService>();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<BadgeService>();
builder.Services.AddScoped<ReviewService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<ActivityService>();

// ── 8. FluentValidation ───────────────────────────────────────────────────────
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestDtoValidator>();

// ── 9. Controllers + JSON ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// ── 10. CORS ──────────────────────────────────────────────────────────────────
// Mobile clients (Expo) may come from various origins; for local dev we allow
// requests from any origin/method/header.
builder.Services.AddCors(options =>
{
    options.AddPolicy("GlobalCors", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// ── 10.1 Response Caching ───────────────────────────────────────────────────
builder.Services.AddResponseCaching();

// ── 11. Swagger / OpenAPI ─────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Virtual Art Gallery API",
        Version = "v1",
        Description = "Backend API for the Virtual Art Gallery platform",
        Contact = new OpenApiContact
        {
            Name = "VirtualArtGallery Team",
            Email = "dev@virtualartgallery.com"
        }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token. Example: Bearer eyJhbGci..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── 12. Health Checks ─────────────────────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database");

// ── 13. Logging ───────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
if (builder.Environment.IsProduction())
{
    // TODO: Add Application Insights or Serilog for structured production logging
}

// ✅ 13.1 HTTP Logging (Development only)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddHttpLogging(options =>
    {
        options.LoggingFields = Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.All;
    });
}

var app = builder.Build();

// ── Auto-apply EF Core Migrations on Startup (Development only) ──────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Artist", "Visitor" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }
}

// ── Middleware Pipeline ────────────────────────────────────────────────

// 1. Global exception handler
app.UseGlobalExceptionHandler();

// 2. HTTPS redirection
// Avoid redirecting during development because the mobile app is typically
// configured to call the HTTP endpoint directly.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 3. Swagger UI (Development only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Virtual Art Gallery API v1");
        c.RoutePrefix = "swagger";
        c.DisplayRequestDuration();
    });
}

// 4. CORS (must run before auth)
app.UseCors("GlobalCors");

// 5. Response Caching
app.UseResponseCaching();

// 6. HTTP Logging (Development only)
if (app.Environment.IsDevelopment())
{
    app.UseHttpLogging();
}

// 7. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// 8. Health check endpoint
app.MapHealthChecks("/health");

// 9. Controllers
app.MapControllers();

// ── Startup log ───────────────────────────────────────────────────────────────
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Virtual Art Gallery API starting on {Env} environment",
    app.Environment.EnvironmentName);

await app.RunAsync();