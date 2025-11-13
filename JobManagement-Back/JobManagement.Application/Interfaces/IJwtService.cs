using JobManagement.Domain.Entities;
public interface IJwtService
{
    string GenerateToken(User user);
    bool ValidateToken(string token);
}