// Program.cs
using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VirtualArtGallery.Api.Hubs;
using VirtualArtGallery.Api.Middleware;
using VirtualArtGallery.Application.Services;
using VirtualArtGallery.Application.Services.Features;
using VirtualArtGallery.Application.Validators;
using VirtualArtGallery.Core.Entities;
using VirtualArtGallery.Core.Interfaces;
using VirtualArtGallery.Infrastructure.Configurations;
using VirtualArtGallery.Infrastructure.Data;
using VirtualArtGallery.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Configuration binding ─────────────────────────────────────────────────
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<CloudStorageSettings>(builder.Configuration.GetSection("CloudStorageSettings"));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<OpenAISettings>(builder.Configuration.GetSection("OpenAISettings"));
builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("StripeSettings"));

// ── 2. Database ───────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
            sqlOptions.MigrationsAssembly("VirtualArtGallery.Infrastructure");
        }));

// ── 3. Identity ───────────────────────────────────────────────────────────────
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
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSettings.Issuer,
            ValidAudience            = jwtSettings.Audience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ClockSkew                = TimeSpan.FromMinutes(1),
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/liveHub") || path.StartsWithSegments("/avatarHub")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode  = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"Authentication required.\"}");
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode  = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"You do not have permission to access this resource.\"}");
            },
        };
    });

// ── 5. Authorization ──────────────────────────────────────────────────────────
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("ArtistOnly",      policy => policy.RequireRole("Artist"))
    .AddPolicy("VisitorOrAbove",  policy => policy.RequireAuthenticatedUser());

// ── 6. Infrastructure Services ────────────────────────────────────────────────
builder.Services.AddScoped<ICloudStorageService, AzureBlobStorageService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAzureOpenAIService, AzureOpenAIService>();
builder.Services.AddHttpClient<IAzureOpenAIService, AzureOpenAIService>(c =>
{
    c.Timeout = TimeSpan.FromSeconds(120);
    c.DefaultRequestHeaders.Add("User-Agent", "VirtualArtGallery");
});
builder.Services.AddScoped<IHuggingFaceService, HuggingFaceVisionService>();
builder.Services.AddHttpClient<HuggingFaceVisionService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "VirtualArtGallery");
});

// ── 7. Application Services ───────────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ArtworkService>();
builder.Services.AddScoped<GalleryService>();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<AiArrangementService>();
builder.Services.AddScoped<ReviewService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<ActivityService>();
builder.Services.AddScoped<StripeService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<BadgeService>();
builder.Services.AddScoped<CollectionService>();
builder.Services.AddScoped<ExportService>();
builder.Services.AddScoped<NotificationSettingsService>();
builder.Services.AddScoped<ArtworkOfTheDayService>();
builder.Services.AddScoped<AvatarService>();
builder.Services.AddScoped<GalleryCustomizationService>();
builder.Services.AddScoped<LiveSessionService>();

// ── 8. FluentValidation ───────────────────────────────────────────────────────
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestDtoValidator>();

// ── 9. Controllers + JSON ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// ── SignalR + custom UserIdProvider ───────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors      = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 102400;
});

// ✅ Tells SignalR to read "userId" claim instead of NameIdentifier
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

// ── 10. CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCors", policy =>
        policy.SetIsOriginAllowed(o => o.StartsWith("http://localhost:") || o.StartsWith("http://127.0.0.1:"))
              .AllowAnyMethod().AllowAnyHeader().AllowCredentials());

    options.AddPolicy("ProductionCors", policy =>
    {
        var allowed = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        if (allowed?.Length > 0)
            policy.WithOrigins(allowed).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

builder.Services.AddResponseCaching();

builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(b => b.Cache());
    options.AddPolicy("GalleryCache", b => b.Expire(TimeSpan.FromMinutes(5)).SetVaryByQuery(["artistId","page","pageSize"]).Tag("galleries"));
    options.AddPolicy("ArtworkCache", b => b.Expire(TimeSpan.FromMinutes(10)).SetVaryByQuery(["id"]).Tag("artworks"));
});

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("AIPolicy",            opt => { opt.PermitLimit = 10;  opt.Window = TimeSpan.FromMinutes(1); opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst; opt.QueueLimit = 2; });
    options.AddFixedWindowLimiter("AuthenticatedPolicy", opt => { opt.PermitLimit = 100; opt.Window = TimeSpan.FromMinutes(1); opt.QueueLimit = 5; });
    options.AddFixedWindowLimiter("AnonymousPolicy",     opt => { opt.PermitLimit = 20;  opt.Window = TimeSpan.FromMinutes(1); });
    options.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.StatusCode  = 429;
        ctx.HttpContext.Response.ContentType = "application/json";
        await ctx.HttpContext.Response.WriteAsJsonAsync(new { error = "Too many requests. Please try again later.", retryAfter = "60 seconds" }, ct);
    };
});

// ── 11. Swagger ───────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Virtual Art Gallery API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "Bearer",
        BearerFormat = "JWT", In = ParameterLocation.Header,
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

// ── 12. Health Checks ─────────────────────────────────────────────────────────
builder.Services.AddHealthChecks().AddDbContextCheck<ApplicationDbContext>("database");

// ── 13. Logging ───────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
builder.Logging.AddFilter("VirtualArtGallery", LogLevel.Debug);
if (builder.Environment.IsDevelopment())
    builder.Services.AddHttpLogging(o => o.LoggingFields = Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.All);

// ── 14. Response Compression ──────────────────────────────────────────────────
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

var app = builder.Build();

// ── Auto Migrations ───────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Artist", "Visitor" })
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseGlobalExceptionHandler();
app.UseResponseCompression();
app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Virtual Art Gallery API v1"); c.RoutePrefix = "swagger"; c.DisplayRequestDuration(); });
}

app.UseCors(app.Environment.IsDevelopment() ? "DevelopmentCors" : "ProductionCors");
app.UseResponseCaching();
app.UseOutputCache();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
    app.UseHttpLogging();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();
app.MapHub<GalleryLiveHub>("/liveHub");

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Virtual Art Gallery API starting on {Env} environment", app.Environment.EnvironmentName);

await app.RunAsync();