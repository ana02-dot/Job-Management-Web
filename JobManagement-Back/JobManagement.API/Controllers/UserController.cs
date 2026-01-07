using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Serilog;
using AutoMapper;
using JobManagement.Application.Dtos;
using BCrypt.Net;
using JobManagement.Domain.Enums;

namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly IUserRepository _userRepository;
    private readonly ICloudStorageService _cloudStorageService;

    public UserController(
        IMapper mapper,
        IUserRepository userRepository,
        ICloudStorageService cloudStorageService)
    {
        _mapper = mapper;
        _userRepository = userRepository;
        _cloudStorageService = cloudStorageService;
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User information</returns>
    /// <response code="200">Returns the user information</response>
    /// <response code="404">If the user is not found</response>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Manager")]
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
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            return BadRequest(new { Message = "Email already exists" });
        }

        if (await _userRepository.PhoneNumberExistsAsync(request.PhoneNumber))
        {
            return BadRequest(new { Message = "Phone number already exists" });
        }

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
    [Authorize(Roles = "Admin")]
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

    /// <summary>
    /// Upload CV for the current user (applicant)
    /// </summary>
    /// <param name="cvFile">CV file (PDF only)</param>
    /// <returns>Upload result with CV URL</returns>
    /// <response code="200">CV uploaded successfully</response>
    /// <response code="400">If the file is invalid</response>
    /// <response code="401">If the user is not authenticated</response>
    [HttpPost("upload-cv")]
    [Authorize]
    [ApiExplorerSettings(IgnoreApi = true)] // Hide from Swagger
    [Consumes("multipart/form-data")]
    [RequestFormLimits(MultipartBodyLengthLimit = 10485760)] // 10MB
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<ActionResult> UploadCv([FromForm] IFormFile cvFile)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            Log.Warning("UploadCv: Invalid user ID claim for authenticated user.");
            return Unauthorized(new { Message = "Invalid user authentication" });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            Log.Warning("UploadCv: User with ID {UserId} not found", userId);
            return NotFound(new { Message = "User not found" });
        }

        if (user.Role != UserRole.Applicant)
        {
            Log.Warning("UploadCv: User {UserId} with role {Role} attempted to upload CV", userId, user.Role);
            return BadRequest(new { Message = "Only applicants can upload CVs" });
        }

        try
        {
            if (!string.IsNullOrEmpty(user.CvUrl))
            {
                await _cloudStorageService.DeleteFileAsync(user.CvUrl);
            }

            var fileName = $"cv_{user.Id}_{user.Email}";
            var cvUrl = await _cloudStorageService.UploadFileAsync(cvFile, "cvs", fileName);
            var fullCvUrl = await _cloudStorageService.GetFileUrlAsync(cvUrl);

            user.CvUrl = cvUrl;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            Log.Information("Successfully uploaded CV for user {UserId}: {CvUrl}", userId, cvUrl);
            return Ok(new { 
                Message = "CV uploaded successfully",
                CvUrl = fullCvUrl 
            });
        }
        catch (ArgumentException ex)
        {
            Log.Warning(ex, "UploadCv: Invalid file for user {UserId}", userId);
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "UploadCv: Error uploading CV for user {UserId}", userId);
            return StatusCode(500, new { Message = "An error occurred while uploading the CV" });
        }
    }

    /// <summary>
    /// Get current user's profile (including CV URL)
    /// </summary>
    /// <returns>Current user information</returns>
    /// <response code="200">Returns the user information</response>
    /// <response code="401">If the user is not authenticated</response>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfo), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<UserInfo>> GetCurrentUserProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            Log.Warning("GetCurrentUserProfile: Invalid user ID claim for authenticated user.");
            return Unauthorized(new { Message = "Invalid user authentication" });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            Log.Warning("GetCurrentUserProfile: User with ID {UserId} not found", userId);
            return NotFound(new { Message = "User not found" });
        }

        var userDto = _mapper.Map<UserInfo>(user);
        
        if (!string.IsNullOrEmpty(user.CvUrl))
        {
            userDto.CvUrl = await _cloudStorageService.GetFileUrlAsync(user.CvUrl);
        }
        return Ok(userDto);
    }
}
