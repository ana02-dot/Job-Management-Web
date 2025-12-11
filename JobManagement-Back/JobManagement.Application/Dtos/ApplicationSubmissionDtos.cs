namespace JobManagement.Application.Dtos;

public class ApplicationSubmissionRequest
{
    public int JobId { get; set; }
    public int? ApplicantId { get; set; } // Optional - backend gets it from JWT token
    public string? Resume { get; set; }
}

public class ApplicationSubmissionResponse
{
    public int ApplicationId { get; set; }
    public string Message { get; set; } = string.Empty;
}
