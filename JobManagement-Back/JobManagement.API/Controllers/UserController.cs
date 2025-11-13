using JobManagement.Application.Services;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using AutoMapper;
using JobManagement.Application.Dtos;

namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IMapper _mapper;

    public UserController(UserService userService, IMapper mapper)
    {
        _userService = userService;
        _mapper = mapper;
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

        var user = await _userService.GetUserByIdAsync(id);
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
        var createdUser = await _userService.CreateUserAsync(request);
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

        var result = await _userService.DeleteUserAsync(id);
        if (!result)
        {
            Log.Warning("User with ID {UserId} not found for deletion", id);
            return NotFound(new { Message = $"User with ID {id} not found" });
        }

        Log.Information("Successfully deleted user with ID {UserId}", id);
        return Ok(new { Message = $"User with ID {id} deleted successfully" });
    }

    /// <summary>
    /// Get all users
    /// </summary>
    /// <returns>List of all users</returns>
    [HttpGet]
    //[Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(IEnumerable<UserInfo>), 200)]
    public async Task<ActionResult<IEnumerable<UserInfo>>> GetAllUsers()
    {
        Log.Information("Getting all users");

        var users = await _userService.GetAllUsersAsync();
        var userInfos = _mapper.Map<IEnumerable<UserInfo>>(users);

        return Ok(userInfos);
    }

    [HttpGet("email")]
    [ProducesResponseType(typeof(User), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<User>> GetUserByEmail(string email)
    {
        Log.Information("Getting user with email {EmailAddress}", email);

        var user = await _userService.GetUserByEmailAsync(email);

        if (user == null)
            return NotFound();

        return Ok(user);
    }
}