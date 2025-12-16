using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using AutoMapper;
using JobManagement.Application.Dtos;
using BCrypt.Net;

namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly IUserRepository _userRepository;

    public UserController(
        IMapper mapper,
        IUserRepository userRepository)
    {
        _mapper = mapper;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User information</returns>
    /// <response code="200">Returns the user information</response>
    /// <response code="404">If the user is not found</response>
    [HttpGet("{id}")]
    //[Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(User), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<UserInfo>> GetUser(int id)
    {
        Log.Information("Getting user with ID: {UserId}", id);

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            Log.Warning("User with ID {UserId} not found", id);
            return NotFound(new { Message = $"User with ID {id} not found" });
        }

        var userDto = _mapper.Map<UserInfo>(user);
        return Ok(userDto);
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="request">User registration data</param>
    /// <returns>Registration result</returns>
    /// <response code="200">User registered successfully</response>
    /// <response code="400">If the request data is invalid</response>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserRegistrationResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<UserRegistrationResponse>> RegisterUser([FromBody] UserRegistrationRequest request)
    {
        // Check if email already exists
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            return BadRequest(new { Message = "Email already exists" });
        }

        // Check if phone number already exists
        if (await _userRepository.PhoneNumberExistsAsync(request.PhoneNumber))
        {
            return BadRequest(new { Message = "Phone number already exists" });
        }

        // Create user entity from request
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            IsEmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdUser = await _userRepository.CreateAsync(user);
        Log.Information("Successfully registered user {UserId} with email {Email}", createdUser.Id, request.Email);
        
        return Ok(new UserRegistrationResponse
        {
            UserId = createdUser.Id,
            Message = "User created successfully",
        });
    }

    /// <summary>
    /// Delete a user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Deletion result</returns>
    /// <response code="200">User deleted successfully</response>
    /// <response code="404">If the user is not found</response>
    [HttpDelete("{id}")]
    //[Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult> DeleteUser(int id)
    {
        Log.Information("Deleting user with ID: {UserId}", id);

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            Log.Warning("User with ID {UserId} not found for deletion", id);
            return NotFound(new { Message = $"User with ID {id} not found" });
        }

        await _userRepository.DeleteAsync(id);
        Log.Information("Successfully deleted user with ID {UserId}", id);
        return Ok(new { Message = $"User with ID {id} deleted successfully" });
    }

    /// <summary>
    /// Get all users
    /// </summary>
    /// <returns>List of all users</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserInfo>), 200)]
    public async Task<ActionResult<IEnumerable<UserInfo>>> GetAllUsers()
    {
        Log.Information("Getting all users");

        var users = await _userRepository.GetAllAsync();
        var userInfos = _mapper.Map<IEnumerable<UserInfo>>(users);

        return Ok(userInfos);
    }

    [HttpGet("email")]
    [ProducesResponseType(typeof(User), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<User>> GetUserByEmail(string email)
    {
        Log.Information("Getting user with email {EmailAddress}", email);

        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null)
            return NotFound();

        return Ok(user);
    }
}
