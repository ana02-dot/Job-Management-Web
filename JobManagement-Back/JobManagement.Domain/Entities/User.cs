using JobManagement.Domain.Common;
using JobManagement.Domain.Enums;
using System.Text.Json.Serialization;

namespace JobManagement.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }

    [JsonIgnore]
    public virtual ICollection<Job> CreatedJobs { get; set; } = new List<Job>();
    [JsonIgnore]
    public virtual ICollection<Applications> Applications { get; set; } = new List<Applications>();
    [JsonIgnore]
    public virtual ICollection<Applications> ReviewedApplications { get; set; } = new List<Applications>();
}