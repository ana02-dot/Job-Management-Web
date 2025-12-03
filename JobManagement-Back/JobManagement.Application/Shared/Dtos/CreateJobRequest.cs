namespace JobManagement.Application.Dtos;

public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public decimal? Salary { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime ApplicationDeadline { get; set; }
}