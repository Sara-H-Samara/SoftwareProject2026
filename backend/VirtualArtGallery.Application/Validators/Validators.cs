using FluentValidation;
using VirtualArtGallery.Application.DTOs.Auth;
using VirtualArtGallery.Application.DTOs.Artworks;
using VirtualArtGallery.Application.DTOs.AI;
using VirtualArtGallery.Core.Enums;

namespace VirtualArtGallery.Application.Validators;

// ── Auth Validators ────────────────────────────────────────────────────────────

public class RegisterRequestDtoValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("Display name is required.")
            .MinimumLength(2).WithMessage("Display name must be at least 2 characters.")
            .MaximumLength(100);

        // Gallery name is required only for artists
        RuleFor(x => x.GalleryName)
            .NotEmpty().WithMessage("Gallery name is required for artist accounts.")
            .MaximumLength(150)
            .When(x => x.UserType == UserType.Artist);
    }
}

public class LoginRequestDtoValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class UpdateProfileRequestDtoValidator : AbstractValidator<UpdateProfileRequestDto>
{
    public UpdateProfileRequestDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .MinimumLength(2).WithMessage("Display name must be at least 2 characters.")
            .MaximumLength(100)
            .When(x => x.DisplayName != null);

        RuleFor(x => x.GalleryName)
            .MaximumLength(150)
            .When(x => x.GalleryName != null);

        RuleFor(x => x.Bio)
            .MaximumLength(1000).WithMessage("Bio cannot exceed 1000 characters.")
            .When(x => x.Bio != null);
    }
}

public class ForgotPasswordRequestDtoValidator : AbstractValidator<ForgotPasswordRequestDto>
{
    public ForgotPasswordRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("A valid email address is required.");
    }
}

public class ResetPasswordRequestDtoValidator : AbstractValidator<ResetPasswordRequestDto>
{
    public ResetPasswordRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Reset token is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
    }
}

// ── Artwork Validators ─────────────────────────────────────────────────────────

public class CreateArtworkRequestDtoValidator : AbstractValidator<CreateArtworkRequestDto>
{
    public CreateArtworkRequestDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Artwork title is required.")
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description != null);

        RuleFor(x => x.Year)
            .InclusiveBetween(1000, DateTime.UtcNow.Year)
            .WithMessage($"Year must be between 1000 and {DateTime.UtcNow.Year}.")
            .When(x => x.Year.HasValue);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price cannot be negative.")
            .When(x => x.Price.HasValue);

        // 3D scale must be positive
        RuleFor(x => x.ScaleX).GreaterThan(0).WithMessage("Scale values must be positive.");
        RuleFor(x => x.ScaleY).GreaterThan(0).WithMessage("Scale values must be positive.");
        RuleFor(x => x.ScaleZ).GreaterThan(0).WithMessage("Scale values must be positive.");
    }
}

public class UpdateArtworkRequestDtoValidator : AbstractValidator<UpdateArtworkRequestDto>
{
    public UpdateArtworkRequestDtoValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200)
            .When(x => x.Title != null);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description != null);

        RuleFor(x => x.Year)
            .InclusiveBetween(1000, DateTime.UtcNow.Year)
            .When(x => x.Year.HasValue);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Price.HasValue);
    }
}

// ── AI Validators ──────────────────────────────────────────────────────────────

public class DescriptionPromptDtoValidator : AbstractValidator<DescriptionPromptDto>
{
    public DescriptionPromptDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Artwork title is required for AI description generation.")
            .MaximumLength(200);

        RuleFor(x => x.ArtworkType)
            .NotEmpty().WithMessage("Artwork type is required.");

        RuleFor(x => x.AdditionalContext)
            .MaximumLength(500)
            .When(x => x.AdditionalContext != null);
    }
}

public class InspirationPromptDtoValidator : AbstractValidator<InspirationPromptDto>
{
    public InspirationPromptDtoValidator()
    {
        RuleFor(x => x.NumberOfIdeas)
            .InclusiveBetween(1, 10)
            .WithMessage("Number of ideas must be between 1 and 10.");

        RuleFor(x => x.ArtistBio)
            .MaximumLength(1000)
            .When(x => x.ArtistBio != null);
    }
}
