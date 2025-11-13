using JobManagement.Domain.Entities;

namespace JobManagement.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByPersonalNumberAsync(string personalNumber);
    Task<List<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(int id);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> PersonalNumberExistsAsync(string personalNumber);
    Task<bool> PhoneNumberExistsAsync(string phoneNumber);
}