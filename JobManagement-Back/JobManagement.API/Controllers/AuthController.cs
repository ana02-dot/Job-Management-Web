using System.Threading.Tasks;
using JobManagement.Application.Dtos;
using JobManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using BCrypt.Net;

namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    private readonly IUserRepository _userRepository;

    public AuthController(IJwtService jwtService, IUserRepository userRepository)
    {
        _jwtService = jwtService;
        _userRepository = userRepository;
    }

    /// <summary>
    /// User login
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT token if successful</returns>
    /// <response code="200">Login successful</response>
    /// <response code="400">Invalid request</response>
    /// <response code="401">Invalid credentials</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        Log.Information("Login attempt for email: {Email}", request.Email);
        
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            Log.Warning("Login attempt with missing email or password");
            return BadRequest(new { message = "Email and password are required" });
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        
        if (user == null)
        {
            Log.Warning("Failed login attempt for email: {Email} - User not found", request.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        
        if (!isPasswordValid)
        {
            Log.Warning("Failed login attempt for email: {Email} - Invalid password", request.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        var token = _jwtService.GenerateToken(user);
        
        Log.Information("Successful login for email: {Email}", request.Email);
        return Ok(new LoginResponse
        {
            Email = user.Email,
            Token = token,
            Message = "Login successful"
        });
    }
}