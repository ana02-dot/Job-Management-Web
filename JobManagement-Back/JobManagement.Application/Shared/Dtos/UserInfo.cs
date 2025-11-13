using JobManagement.Domain.Enums;

namespace JobManagement.Application.Dtos;

public class UserInfo
{
    public int Id { get; set; }
    public string PersonalNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsPersonalNumberVerified { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }

}