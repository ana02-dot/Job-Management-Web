namespace JobManagement.Application.Services;

public class PhoneValidationResult
{
    public bool IsValid { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public string Carrier { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}
