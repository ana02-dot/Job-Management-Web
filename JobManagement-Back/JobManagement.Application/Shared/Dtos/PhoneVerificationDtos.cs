namespace JobManagement.Application.Dtos;

public class RequestOtpRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class RequestOtpResponse
{
    public string Message { get; set; } = string.Empty;
    public bool Success { get; set; }
    // In development only - remove in production
    public string? OtpCode { get; set; }
}

public class VerifyOtpRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}

public class VerifyOtpResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

