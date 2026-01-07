using System;
using JobManagement.Domain.Enums;

namespace JobManagement.Application.Dtos;

public class UserInfo
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CvUrl { get; set; } // URL to CV file in cloud storage

}