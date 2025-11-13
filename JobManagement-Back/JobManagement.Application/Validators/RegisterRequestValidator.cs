using FluentValidation;
using JobManagement.Application.Dtos;

namespace JobManagement.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<UserRegistrationRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(u => u.PersonalNumber)
            .NotEmpty()
            .WithMessage("Personal number is required")
            .Length(11)
            .WithMessage("Personal number must be exactly 11 digits")
            .Matches(@"^\d{11}$")
            .WithMessage("Personal number must contain only digits");

        RuleFor(u => u.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .Length(2, 100)
            .WithMessage("First name must be between 2 and 100 characters")
            .Matches(@"^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$")
            .WithMessage("First name contains invalid characters");

        RuleFor(u => u.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .Length(2, 100)
            .WithMessage("Last name must be between 2 and 100 characters")
            .Matches(@"^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$")
            .WithMessage("Last name contains invalid characters");

        RuleFor(u => u.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Invalid email format")
            .MaximumLength(200)
            .WithMessage("Email cannot exceed 200 characters");

        RuleFor(u => u.PhoneNumber)
            .MaximumLength(50)
            .WithMessage("Phone number cannot exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(u => u.Password)
            .NotEmpty()
            .WithMessage("Password is required")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters long")
            .MaximumLength(100)
            .WithMessage("Password cannot exceed 100 characters")
            .Matches(@"[A-Z]")
            .WithMessage("Password must contain at least one uppercase letter")
            .Matches(@"[a-z]")
            .WithMessage("Password must contain at least one lowercase letter")
            .Matches(@"\d")
            .WithMessage("Password must contain at least one number")
            .Matches(@"[@$!%*?&]")
            .WithMessage("Password must contain at least one special character (@$!%*?&)");

        RuleFor(u => u.Role)
            .IsInEnum()
            .WithMessage("Invalid user role");
    }
}