using System.ComponentModel.DataAnnotations;
using AutoMapper;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Application.Dtos;


namespace JobManagement.Application.Services;

public class UserService
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public UserService(
        IUserRepository userRepository,
        IMapper mapper
        )
    {
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<User?> GetUserByIdAsync(int id) =>
        await _userRepository.GetByIdAsync(id);
    
    public async Task<User?> GetUserByEmailAsync(string email) =>
         await _userRepository.GetByEmailAsync(email);
    
    public async Task<IEnumerable<User>> GetAllUsersAsync() =>
        await _userRepository.GetAllAsync();

    public async Task<User> CreateUserAsync(UserRegistrationRequest request)
    {
        // Validate email uniqueness
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            throw new ValidationException("Email already exists");
        }
        
        // Validate personal number uniqueness
        if (await _userRepository.PersonalNumberExistsAsync(request.PersonalNumber))
        {
            throw new ValidationException("Personal number already exists");
        }
        
        // Validate phone number uniqueness
        if (await _userRepository.PhoneNumberExistsAsync(request.PhoneNumber))
        {
            throw new ValidationException("Phone number already exists");
        }

        var user = _mapper.Map<User>(request);
        
        // Hash password and set timestamps
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        user.CreatedBy = null;

        var createdUser = await _userRepository.CreateAsync(user);
        return createdUser;
    }

    public async Task<User?> ValidateUserCredentialsAsync(string email, string password)
    { 
        var user = await _userRepository.GetByEmailAsync(email);
            if (user == null) return null;
            
            if (string.IsNullOrEmpty(user.PasswordHash))
                return null;

            var isValidPassword = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            return (isValidPassword ? user : null); 
    }
    
    public async Task<User> UpdateUserAsync(User user)
    {
        if (user == null)
        {
            throw new ArgumentNullException(nameof(user));
        }
        var existingUser = await _userRepository.GetByIdAsync(user.Id);
        if (existingUser == null)
        {
            throw new ValidationException("User not found");
        }
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return user;
    }
    
    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return false;
        }

        await _userRepository.DeleteAsync(id);
        return true;
    }
}