using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace JobManagement.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly JobManagementDbContext _context;

    public UserRepository(JobManagementDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Where(u => u.IsDeleted == 0)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Where(u => u.IsDeleted == 0)  
            .FirstOrDefaultAsync(u => u.Email == email);
        
    }

    public async Task<User?> GetByPersonalNumberAsync(string personalNumber)
    {
        return await _context.Users
            .Where(u => u.IsDeleted == 0)
            .FirstOrDefaultAsync(u => u.PersonalNumber == personalNumber);
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users
            .ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            user.IsDeleted = 1;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Users
            .Where(u => u.IsDeleted != 1)
            .AnyAsync(u => u.Id == id);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email);
    }

    public async Task<bool> PersonalNumberExistsAsync(string personalNumber)
    {
        return await _context.Users
            .AnyAsync(u => u.PersonalNumber == personalNumber);
    }

    public async Task<bool> PhoneNumberExistsAsync(string phoneNumber)
    {
        return await _context.Users
            .AnyAsync(u => u.PhoneNumber == phoneNumber);
    }
}