using FluentValidation;
using JobManagement.Application.Dtos;
using System;

namespace JobManagement.Application.Validators;

public class CreateJobRequestValidator : AbstractValidator<CreateJobRequest>
{
    public CreateJobRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must be at most 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.");

        RuleFor(x => x.Requirements)
            .NotEmpty().WithMessage("Requirements are required.");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required.")
            .MaximumLength(200).WithMessage("Location must be at most 200 characters.");

        RuleFor(x => x.ApplicationDeadline)
            .GreaterThan(DateTime.UtcNow).
            WithMessage("Application deadline must be in the future.");
        RuleFor(x => x.Salary)
            .GreaterThanOrEqualTo(0).When(x => x.Salary.HasValue)
            .WithMessage("Salary must be non-negative when specified.");
    }
}