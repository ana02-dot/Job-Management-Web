using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Security.Claims;
using System.Threading.Tasks;
using JobManagement.Application.Dtos;
using JobManagement.Domain.Enums;

namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class JobsController : ControllerBase
{
    private readonly IJobRepository _jobRepository;
    private readonly IUserRepository _userRepository;

    public JobsController(IJobRepository jobRepository, IUserRepository userRepository)
    {
        _jobRepository = jobRepository;
        _userRepository = userRepository;
    }
    
    /// <summary>
    /// Get all jobs
    /// </summary>
    /// <returns>List of all jobs</returns>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(List<Job>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<List<Job>>> GetAllJobs()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var resolvedRole = GetUserRoleFromClaims();
        
        Log.Information("GetAllJobs - User ID: {UserId}, ResolvedRole: {ResolvedRole}", userIdClaim, resolvedRole);
        
        if (resolvedRole == null)
        {
            return StatusCode(403, new { Message = "Unable to determine user role" });
        }
        
        if (resolvedRole != UserRole.Admin && resolvedRole != UserRole.HR && resolvedRole != UserRole.Applicant)
        {
            return StatusCode(403, new { Message = "Only Admin, HR, and Applicant users can view jobs" });
        }
        
        if (!int.TryParse(userIdClaim, out int currentUserId))
        {
            return StatusCode(403, new { Message = "Invalid user authentication" });
        }
        
        List<Job> jobs;
        
        if (resolvedRole == UserRole.Admin || resolvedRole == UserRole.Applicant)
        {
            Log.Information("{Role} user {UserId} - returning all jobs", resolvedRole, currentUserId);
            jobs = await _jobRepository.GetAllAsync();
        }
        else 
        {
            Log.Information("HR user {UserId} - filtering jobs by CreatedBy={CreatedBy}", currentUserId, currentUserId);
            jobs = await _jobRepository.GetByCreatorAsync(currentUserId);
            
            var beforeCount = jobs.Count;
            jobs = jobs.Where(j => j.CreatedBy.HasValue && j.CreatedBy.Value == currentUserId).ToList();
            
            if (beforeCount != jobs.Count)
            {
                Log.Warning("Filtered out {RemovedCount} jobs not owned by HR user {UserId}", 
                    beforeCount - jobs.Count, currentUserId);
            }
            
            Log.Information("HR user {UserId} will receive {JobCount} jobs", currentUserId, jobs.Count);
        }
        
        return Ok(jobs);
    }
    
    /// <summary>
    /// Get jobs by status
    /// </summary>
    /// <param name="status">Job status</param>
    /// <returns>List of jobs with specified status</returns>
    [HttpGet("status/{status}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<Job>), 200)]
    public async Task<ActionResult<List<Job>>> GetJobsByStatus(JobStatus status)
    {
        Log.Information("Getting jobs by status: {Status}", status);
        var jobs = await _jobRepository.GetByStatusAsync(status);
        Log.Information("Retrieved {JobCount} jobs", jobs.Count);
        return Ok(jobs);
    }
    
    /// <summary>
    /// Get job by ID
    /// </summary>
    /// <param name="id">Job ID</param>
    /// <returns>Job information</returns>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(Job), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<Job>> GetJob(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            UserRole? resolvedRole = null;
            
            if (User.Identity?.IsAuthenticated == true)
            {
                try
                {
                    resolvedRole = GetUserRoleFromClaims();
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "GetJob - Error resolving role, but allowing access anyway (AllowAnonymous endpoint)");
                }
            }
            
            Log.Information("GetJob - User ID: {UserId}, JobId: {JobId}, Role: {ResolvedRole}", 
                userIdClaim ?? "Anonymous", id, resolvedRole?.ToString() ?? "null");
            
            var job = await _jobRepository.GetByIdAsync(id);
            if (job == null)
            {
                Log.Warning("Job with ID {JobId} not found", id);
                return NotFound(new { Message = $"Job with ID {id} not found" });
            }
            
            if (resolvedRole == UserRole.HR)
            {
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized(new { Message = "Invalid user authentication" });
                }
                
                if (!job.CreatedBy.HasValue || job.CreatedBy.Value != currentUserId)
                {
                    Log.Warning("HR user {UserId} attempted to view job {JobId} created by {CreatedBy}", 
                        currentUserId, id, job.CreatedBy);
                    return StatusCode(403, new { Message = "You can only view jobs you created" });
                }
            }
            
            return Ok(job);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "GetJob - Unexpected error retrieving job {JobId}", id);
            return StatusCode(500, new { Message = "An error occurred while retrieving the job details." });
        }
    }
    
    /// <summary>
    /// Create a new job posting
    /// </summary>
    /// <param name="request">Job creation data</param>
    /// <returns>Created job ID</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(int), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<int>> CreateJob([FromBody] CreateJobRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var resolvedRole = GetUserRoleFromClaims();
            
            Log.Information("CreateJob - User ID: {UserId}, Role: {Role}", userId, resolvedRole);
            
            if (!IsAdminOrHR())
            {
                Log.Warning("User {UserId} with role {Role} attempted to create job (unauthorized)", userId, resolvedRole);
                return Forbid("Only Admin and HR users can create jobs");
            }
            
            var creator = await _userRepository.GetByIdAsync(userId);
            if (creator == null)
            {
                return BadRequest(new { Message = "Creator not found" });
            }
            
            var job = new Job
            {
                Title = request.Title,
                Description = request.Description,
                Requirements = request.Requirements,
                Salary = request.Salary.HasValue ? request.Salary.Value.ToString() : string.Empty,
                Location = request.Location,
                ApplicationDeadline = request.ApplicationDeadline,
                Status = JobStatus.Active,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                WorkType = request.WorkType ?? string.Empty,
                Category = request.Category ?? string.Empty
            };
            
            var createdJob = await _jobRepository.CreateAsync(job);
            Log.Information("Job created successfully - ID: {JobId}, Title: {Title}, CreatedBy: {CreatedBy}", 
                createdJob.Id, createdJob.Title, createdJob.CreatedBy);
            
            return CreatedAtAction(nameof(GetJob), new { id = createdJob.Id }, createdJob.Id);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to create job. Request: {@Request}", request);
            return BadRequest(new { error = "Failed to post job", message = ex.Message });
        }
    }
    
    /// <summary>
    /// Update an existing job posting
    /// </summary>
    /// <param name="id">Job ID</param>
    /// <param name="request">Job update data</param>
    /// <returns>No content on success</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult> UpdateJob(int id, [FromBody] CreateJobRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var resolvedRole = GetUserRoleFromClaims();
            
            if (!IsAdminOrHR())
            {
                Log.Warning("User {UserId} with role {Role} attempted to update job {JobId}", userId, resolvedRole, id);
                return Forbid("Only Admin and HR users can update jobs");
            }
            
            var existingJob = await _jobRepository.GetByIdAsync(id);
            if (existingJob == null)
            {
                return NotFound(new { error = "Job not found" });
            }
            
            var updater = await _userRepository.GetByIdAsync(userId);
            if (updater == null)
            {
                return BadRequest(new { Message = "Updater not found" });
            }
            
            existingJob.Title = request.Title;
            existingJob.Description = request.Description;
            existingJob.Requirements = request.Requirements;
            existingJob.Salary = request.Salary.HasValue ? request.Salary.Value.ToString() : string.Empty;
            existingJob.Location = request.Location;
            existingJob.WorkType = request.WorkType;
            existingJob.Category = request.Category;
            existingJob.ApplicationDeadline = request.ApplicationDeadline;
            existingJob.UpdatedAt = DateTime.UtcNow;
            
            await _jobRepository.UpdateAsync(existingJob);
            Log.Information("Successfully updated job {JobId}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error updating job {JobId}", id);
            return BadRequest(new { error = "Failed to update job", message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a job posting (soft delete)
    /// </summary>
    /// <param name="id">Job ID</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult> DeleteJob(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var resolvedRole = GetUserRoleFromClaims();
            
            if (!IsAdminOrHR())
            {
                Log.Warning("User {UserId} with role {Role} attempted to delete job {JobId}", userId, resolvedRole, id);
                return Forbid("Only Admin and HR users can delete jobs");
            }
            
            var existingJob = await _jobRepository.GetByIdAsync(id);
            if (existingJob == null)
            {
                return NotFound(new { error = "Job not found" });
            }
            
            var deleter = await _userRepository.GetByIdAsync(userId);
            if (deleter == null)
            {
                return BadRequest(new { Message = "User not found" });
            }
            
            await _jobRepository.DeleteAsync(id);
            Log.Information("Successfully deleted job {JobId}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error deleting job {JobId}", id);
            return BadRequest(new { error = "Failed to delete job", message = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            Log.Error("GetCurrentUserId - Failed to parse userId from claim: '{UserIdClaim}'", userIdClaim);
            throw new InvalidOperationException($"User ID not found in token claims");
        }
        
        return userId;
    }

    private UserRole? GetUserRoleFromClaims()
    {
        var roleClaims = new List<string?>
        {
            User.FindFirst(ClaimTypes.Role)?.Value,
            User.FindFirst("role")?.Value,
            User.FindFirst("role_value")?.Value,
            User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
        };

        foreach (var claim in User.Claims)
        {
            if (claim.Type.Contains("role", StringComparison.OrdinalIgnoreCase) && 
                !roleClaims.Contains(claim.Value))
            {
                roleClaims.Add(claim.Value);
            }
        }

        foreach (var claimValue in roleClaims)
        {
            if (string.IsNullOrWhiteSpace(claimValue))
                continue;

            if (Enum.TryParse<UserRole>(claimValue, ignoreCase: true, out var parsedByName))
            {
                return parsedByName;
            }

            if (int.TryParse(claimValue, out var parsedInt) && Enum.IsDefined(typeof(UserRole), parsedInt))
            {
                return (UserRole)parsedInt;
            }
        }
        
        return null;
    }

    private bool IsAdminOrHR()
    {
        var role = GetUserRoleFromClaims();
        return role == UserRole.Admin || role == UserRole.HR;
    }
}
