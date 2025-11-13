using System.Security.Claims;
using JobManagement.Application.Dtos;
using JobManagement.Application.Services;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace JobManagement.API.Controllers;
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    private readonly UserService _userService;

    public AuthController(IJwtService jwtService, UserService userService)
    {
        _jwtService = jwtService;
        _userService = userService;
    }
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        Log.Information("Login attempt for email: {Email}", request.Email);
        
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            Log.Warning("Login attempt with missing email or password");
            return BadRequest(new { message = "Email and password are required" });
        }

        var user = await _userService.ValidateUserCredentialsAsync(request.Email, request.Password);
        
        if (user == null)
        {
            Log.Warning("Failed login attempt for email: {Email}", request.Email);
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