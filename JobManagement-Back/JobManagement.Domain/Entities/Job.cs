using JobManagement.Domain.Common;
using JobManagement.Domain.Enums;

namespace JobManagement.Domain.Entities;

public class Job : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public decimal? Salary { get; set; }
    public string Location { get; set; } = string.Empty;
    public JobStatus Status { get; set; } = JobStatus.Active;
    public DateTime ApplicationDeadline { get; set; }
    
    public virtual ICollection<Applications> Applications { get; set; } = new List<Applications>();
}