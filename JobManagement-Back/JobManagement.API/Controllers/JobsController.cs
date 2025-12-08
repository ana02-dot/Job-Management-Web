using JobManagement.Application.Services;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Security.Claims;
using JobManagement.Application.Dtos;
using JobManagement.Domain.Enums;
using System.Linq;
namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class JobsController : ControllerBase
{
    private readonly JobService _jobService;
    public JobsController(JobService jobService)
    {
        _jobService = jobService;
    }
    
    /// <summary>
    /// Get all jobs
    /// </summary>
    /// <returns>List of all jobs</returns>
    [HttpGet]
    [Authorize] // Allow any authenticated user, we'll check role manually
    [ProducesResponseType(typeof(List<Job>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<List<Job>>> GetAllJobs()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var resolvedRole = GetUserRoleFromClaims();
        
        // Don't log sensitive claim values - only log role resolution result
        Log.Information("GetAllJobs - User ID: {UserId}, ResolvedRole: {ResolvedRole}", userIdClaim, resolvedRole);
        
        if (!IsAdminOrHR())
        {
            Log.Warning("User {UserId} with resolved role {ResolvedRole} attempted to access GetAllJobs (unauthorized)", 
                userIdClaim, resolvedRole);
            return Forbid("Only Admin and HR users can view jobs");
        }
        
        // Admin users see all jobs, HR users see only their own jobs
        int? userId = null;
        
        // Determine roles via resolved role
        if (resolvedRole == null)
        {
            Log.Error("GetAllJobs: Could not resolve user role for user {UserId}", userIdClaim);
            return Forbid("Unable to determine user role");
        }
        
        var isAdmin = resolvedRole == UserRole.Admin;
        var isHR = resolvedRole == UserRole.HR;
        
        // Always filter by user ID unless user is Admin
        // This ensures HR users only see their own jobs
        if (!isAdmin)
        {
            if (int.TryParse(userIdClaim, out int currentUserId))
            {
                userId = currentUserId;
                Log.Information("{Role} user {UserId} - Filtering jobs by CreatedBy={CreatedBy}", 
                    isHR ? "HR" : "Non-admin", currentUserId, currentUserId);
            }
            else
            {
                Log.Error("Could not parse userId from claim: '{UserIdClaim}'", userIdClaim);
                return Forbid("Invalid user authentication");
            }
        }
        else
        {
            Log.Information("Admin user - showing all jobs (no filter)");
        }
        
        var jobs = await _jobService.GetAllJobsAsync(userId);
        
        // Verify filtering worked - log job CreatedBy values
        Log.Information("Retrieved {JobCount} jobs for user {UserId} (filter userId: {FilterUserId})", 
            jobs.Count, userIdClaim, userId?.ToString() ?? "null");
        
        if (userId.HasValue && jobs.Any())
        {
            var jobsNotOwned = jobs.Where(j => j.CreatedBy != userId.Value).ToList();
            if (jobsNotOwned.Any())
            {
                Log.Warning("⚠️ Found {Count} jobs not owned by user {UserId}: {JobIds}", 
                    jobsNotOwned.Count, userId.Value, string.Join(", ", jobsNotOwned.Select(j => $"JobId:{j.Id}, CreatedBy:{j.CreatedBy}")));
            }
        }
        
        // Log job details for debugging (first 5 jobs)
        int logCount = 0;
        foreach (var job in jobs.Take(5))
        {
            Log.Information("Job ID: {JobId}, Title: {Title}, CreatedBy: {CreatedBy}", job.Id, job.Title, job.CreatedBy);
            logCount++;
        }
        if (jobs.Count > 5)
        {
            Log.Information("... and {RemainingCount} more jobs", jobs.Count - 5);
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
        var jobs = await _jobService.GetJobsByStatusAsync(status);
        Log.Information("Retrieved {JobCount} jobs", jobs.Count);
        return Ok(jobs);
    }
    
    /// <summary>
    /// Get job by ID
    /// </summary>
    /// <param name="id">Job ID</param>
    /// <returns>Job information</returns>
    /// <response code="200">Returns the job information</response>
    /// <response code="404">If the job is not found</response>

    [HttpGet("{id}")]
    [AllowAnonymous] // Allow anyone to view job details (needed for applicants)
    [ProducesResponseType(typeof(Job), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<Job>> GetJob(int id)
    {
        Log.Information("Getting job with ID: {JobId}", id);
        
        var job = await _jobService.GetJobByIdAsync(id);
        if (job == null)
        {
            Log.Warning("Job with ID {JobId} not found", id);
            return NotFound(new { Message = $"Job with ID {id} not found" });
        }
        
        Log.Information("Successfully retrieved job {JobId}: {JobTitle}", id, job.Title);
        return Ok(job);
    }
    
    /// <summary>
    /// Create a new job posting
    /// </summary>
    /// <param name="request">Job creation data</param>
    /// <returns>Created job ID</returns>
    /// <response code="201">Job created successfully</response>
    /// <response code="400">If the request data is invalid</response>

    [HttpPost]
    [Authorize] // Allow any authenticated user, we'll check role manually
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
            
            // Don't log sensitive claim data
            Log.Information("CreateJob - User ID: {UserId}, ResolvedRole: {Role}", userId, resolvedRole);
            
            if (!IsAdminOrHR())
            {
                Log.Warning("User {UserId} with role {Role} attempted to create job (unauthorized)", userId, resolvedRole);
                return Forbid("Only Admin and HR users can create jobs");
            }
            
            Log.Information("Creating job. Request: {@Request}, CreatedBy (FK to User.Id): {CreatedBy}", request, userId);
            var createdJob = await _jobService.CreateJobAsync(request, userId);
            Log.Information("Job created successfully - ID: {JobId}, Title: {Title}, CreatedBy (FK): {CreatedBy}, CreatedAt: {CreatedAt}", 
                createdJob.Id, createdJob.Title, createdJob.CreatedBy, createdJob.CreatedAt);
            
            // Verify the CreatedBy foreign key was set correctly
            if (createdJob.CreatedBy != userId)
            {
                Log.Error("⚠️ MISMATCH: Job CreatedBy FK ({JobCreatedBy}) does not match userId ({UserId})!", 
                    createdJob.CreatedBy, userId);
            }
            else
            {
                Log.Information("✓ Verified: Job CreatedBy FK ({CreatedBy}) correctly set to userId ({UserId})", 
                    createdJob.CreatedBy, userId);
            }
            
            return CreatedAtAction(nameof(GetJob), new { id = createdJob.Id }, createdJob.Id);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to create job. Request: {@Request}", request);
            var innerException = ex.InnerException;
            while (innerException != null)
            {
                Log.Error("Inner exception: {Message}", innerException.Message);
                innerException = innerException.InnerException;
            }
            return BadRequest(new { error = "Failed to post job", message = ex.Message, innerException = ex.InnerException?.Message });
        }
    }
    
    /// <summary>
    /// Update an existing job posting
    /// </summary>
    /// <param name="id">Job ID</param>
    /// <param name="request">Job update data</param>
    /// <returns>No content on success</returns>
    /// <response code="204">Job updated successfully</response>
    /// <response code="400">If the request data is invalid</response>
    /// <response code="404">If the job is not found</response>
    [HttpPut("{id}")]
    [Authorize] // Allow any authenticated user, we'll check role manually
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
            
            Log.Information("Updating job with ID: {JobId}. User claims: {Claims}", id, string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
            await _jobService.UpdateJobAsync(id, request, userId);
            Log.Information("Successfully updated job {JobId}", id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            Log.Warning(ex, "Failed to update job {JobId}", id);
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            Log.Warning(ex, "Unauthorized attempt to update job {JobId}", id);
            return Forbid();
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
    /// <response code="204">Job deleted successfully</response>
    /// <response code="404">If the job is not found</response>
    [HttpDelete("{id}")]
    [Authorize] // Allow any authenticated user, we'll check role manually
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
            
            Log.Information("Deleting job with ID: {JobId}. User claims: {Claims}", id, string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
            await _jobService.DeleteJobAsync(id, userId);
            Log.Information("Successfully deleted job {JobId}", id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            Log.Warning(ex, "Failed to delete job {JobId}", id);
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            Log.Warning(ex, "Unauthorized attempt to delete job {JobId}", id);
            return Forbid();
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
        Log.Information("GetCurrentUserId - Raw claim value: '{UserIdClaim}'", userIdClaim ?? "null");
        
        // Also try alternative claim names
        var subClaim = User.FindFirst("sub")?.Value;
        var nameIdClaim = User.FindFirst("nameid")?.Value;
        
        Log.Information("GetCurrentUserId - Alternative claims - sub: '{Sub}', nameid: '{NameId}'", 
            subClaim ?? "null", nameIdClaim ?? "null");
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            Log.Error("GetCurrentUserId - Failed to parse userId from ClaimTypes.NameIdentifier: '{UserIdClaim}'", userIdClaim);
            Log.Error("GetCurrentUserId - All available claims: {Claims}", 
                string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
            throw new InvalidOperationException($"User ID not found in token claims. Claim value: '{userIdClaim}'");
        }
        
        Log.Information("GetCurrentUserId - Successfully extracted userId: {UserId}", userId);
        return userId;
    }

    /// <summary>
    /// Robust role resolver that handles all possible claim types and both enum names and numeric values.
    /// </summary>
    private UserRole? GetUserRoleFromClaims()
    {
        // Try all possible claim types (after DefaultInboundClaimTypeMap.Clear(), claims might use different types)
        var roleClaims = new List<string?>
        {
            User.FindFirst(ClaimTypes.Role)?.Value,
            User.FindFirst("role")?.Value,
            User.FindFirst("role_value")?.Value,
            User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value,
            User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value // Sometimes role is in sub
        };

        // Also check all claims for role-related values
        foreach (var claim in User.Claims)
        {
            if (claim.Type.Contains("role", StringComparison.OrdinalIgnoreCase) && 
                !roleClaims.Contains(claim.Value))
            {
                roleClaims.Add(claim.Value);
            }
        }

        // Try to resolve from any available claim
        foreach (var claimValue in roleClaims)
        {
            if (string.IsNullOrWhiteSpace(claimValue))
                continue;

            // Try parsing as enum name first (e.g., "Admin", "HR", "Applicant")
            if (Enum.TryParse<UserRole>(claimValue, ignoreCase: true, out var parsedByName))
            {
                Log.Information("GetUserRoleFromClaims: successfully parsed '{ClaimValue}' as enum name -> {Role}", claimValue, parsedByName);
                return parsedByName;
            }

            // Try parsing as numeric value (e.g., "0", "1", "2")
            if (int.TryParse(claimValue, out var parsedInt) && Enum.IsDefined(typeof(UserRole), parsedInt))
            {
                var role = (UserRole)parsedInt;
                Log.Information("GetUserRoleFromClaims: successfully parsed '{ClaimValue}' as numeric value -> {Role}", claimValue, role);
                return role;
            }
        }

        // Log all claims for debugging (but don't expose sensitive data)
        var claimTypes = User.Claims.Select(c => c.Type).Distinct().ToList();
        Log.Warning("GetUserRoleFromClaims: unable to parse role from any claim. Available claim types: {ClaimTypes}", 
            string.Join(", ", claimTypes));
        
        return null;
    }

    private bool IsAdminOrHR()
    {
        var role = GetUserRoleFromClaims();
        
        if (role == null)
        {
            Log.Warning("IsAdminOrHR: role is null - user may not be authenticated properly");
            return false;
        }
        
        var isAdmin = role == UserRole.Admin;
        var isHR = role == UserRole.HR;

        Log.Information("IsAdminOrHR check - resolved role: {Role}, isAdmin: {IsAdmin}, isHR: {IsHR}", role, isAdmin, isHR);

        return isAdmin || isHR;
    }
}