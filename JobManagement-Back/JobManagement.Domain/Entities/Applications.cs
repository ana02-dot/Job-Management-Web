using JobManagement.Domain.Common;
using JobManagement.Domain.Enums;

namespace JobManagement.Domain.Entities;

public class Applications : BaseEntity
{
    public int JobId { get; set; }
    public int ApplicantId { get; set; }
    public string Resume { get; set; } = null!; // File path or content
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
        
    public virtual Job Job { get; set; } = null!;
    public virtual User Applicant { get; set; } = null!;
    public virtual User? ReviewedBy { get; set; }
}