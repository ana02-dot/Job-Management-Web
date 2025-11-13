using System.Runtime.InteropServices.JavaScript;
using JobManagement.Domain.Common;
using JobManagement.Domain.Enums;

namespace JobManagement.Domain.Entities;

public class User : BaseEntity
{
    public string PersonalNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsPersonalNumberVerified { get; set; }
    public DateTime? PersonalNumberVerifiedAt { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }

    public virtual ICollection<Job> CreatedJobs { get; set; } = new List<Job>();
    public virtual ICollection<Applications> Applications { get; set; } = new List<Applications>();
    public virtual ICollection<Applications> ReviewedApplications { get; set; } = new List<Applications>();
}