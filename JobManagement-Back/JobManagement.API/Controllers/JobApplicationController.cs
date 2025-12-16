using System;
using System.Collections.Generic;
using System.Linq;
using JobManagement.Application.Services;
using JobManagement.Application.Dtos;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Security.Claims;
using System.Threading.Tasks;

namespace JobManagement.API.Controllers;
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class JobApplicationController : ControllerBase
{
    private readonly JobApplicationService _jobApplicationService;
    private readonly IJobRepository _jobRepository;

    public JobApplicationController(JobApplicationService jobApplicationService, IJobRepository jobRepository)
    {
        _jobApplicationService = jobApplicationService;
        _jobRepository = jobRepository;
    }
    /// <summary>
    /// Submit a new job application
    /// </summary>
    /// <param name="request">Application submission data</param>
    /// <returns>Application submission result</returns>
    /// <response code="200">Application submitted successfully</response>
    /// <response code="400">If the request data is invalid</response>
    [HttpPost("submit")]
    [Authorize(Policy = "ApplicantOnly")] // Only applicants can submit applications
    [ProducesResponseType(typeof(ApplicationSubmissionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<ApplicationSubmissionResponse>> SubmitApplication([FromBody] ApplicationSubmissionRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int applicantId))
        {
            Log.Warning("SubmitApplication: Invalid user ID claim for authenticated user.");
            return Unauthorized(new { Message = "Invalid user authentication" });
        }

        Log.Information("SubmitApplication - User ID: {UserId}, Job ID: {JobId}", applicantId, request.JobId);
        
        try
        {
            var application = new Applications
            {
                JobId = request.JobId,
                Resume = request.Resume ?? string.Empty,
            };
            var applicationId = await _jobApplicationService.SubmitApplicationAsync(application, applicantId);
            Log.Information("Successfully submitted application {ApplicationId} for job {JobId}", applicationId, request.JobId);
            return Ok(new ApplicationSubmissionResponse
            {
                ApplicationId = applicationId,
                Message = "Application submitted successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            Log.Warning(ex, "SubmitApplication: Unauthorized application submission attempt by user {UserId}", applicantId);
            return StatusCode(403, new { Message = "You do not have permission to submit applications" });
        }
        catch (InvalidOperationException ex)
        {
            Log.Warning(ex, "SubmitApplication: Invalid operation for user {UserId} on job {JobId}", applicantId, request.JobId);
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "SubmitApplication: Error submitting application for job {JobId}", request.JobId);
            return StatusCode(500, new { Message = "An unexpected error occurred while submitting the application." });
        }
    }

        /// <summary>
        /// Get all applications for a specific job
        /// </summary>
        /// <param name="jobId">Job ID</param>
        /// <returns>List of applications for the job</returns>
        /// <response code="200">Returns the list of applications</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role</response>
        /// <response code="404">If the job is not found</response>
        [HttpGet("job/{jobId}")]
        [Authorize] // Require authentication - authorization logic is handled in the method
        [ProducesResponseType(typeof(List<Applications>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<List<Applications>>> GetApplicationsByJob(int jobId)
        {
            Log.Debug("GetApplicationsByJob: Starting request for JobId {JobId}", jobId);
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                Log.Warning("GetApplicationsByJob: Invalid user ID claim for authenticated user.");
                return Unauthorized(new { Message = "Invalid user authentication" });
            }

            // Get the role claim - check both IsInRole and direct claim lookup for robustness
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var roleValueClaim = User.FindFirst("role_value")?.Value;
            
            // Try to determine role from multiple sources
            UserRole? userRole = null;
            if (!string.IsNullOrEmpty(roleClaim))
            {
                if (Enum.TryParse<UserRole>(roleClaim, true, out var parsedRole))
                {
                    userRole = parsedRole;
                }
            }
            else if (!string.IsNullOrEmpty(roleValueClaim) && int.TryParse(roleValueClaim, out int roleInt))
            {
                userRole = (UserRole)roleInt;
            }
            
            var isInRoleAdmin = User.IsInRole(UserRole.Admin.ToString());
            var isInRoleHR = User.IsInRole(UserRole.HR.ToString());
            bool isAdmin = isInRoleAdmin || userRole == UserRole.Admin || 
                          (roleClaim != null && roleClaim.Equals(UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase));
            bool isHR = isInRoleHR || userRole == UserRole.HR || 
                       (roleClaim != null && roleClaim.Equals(UserRole.HR.ToString(), StringComparison.OrdinalIgnoreCase));

            var allClaims = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
            Log.Information("GetApplicationsByJob: User {UserId}, RoleClaim: {RoleClaim}, RoleValueClaim: {RoleValueClaim}, UserRole: {UserRole}, IsInRole(Admin): {IsInRoleAdmin}, IsInRole(HR): {IsInRoleHR}, IsAdmin: {IsAdmin}, IsHR: {IsHR}, JobId: {JobId}, AllClaims: {AllClaims}",
                currentUserId, roleClaim, roleValueClaim, userRole?.ToString() ?? "null", isInRoleAdmin, isInRoleHR, isAdmin, isHR, jobId, allClaims);

            // If policy passed but we can't determine role, something is wrong
            if (!isAdmin && !isHR)
            {
                Log.Error("GetApplicationsByJob: User {UserId} is neither Admin nor HR. RoleClaim: {RoleClaim}, All claims: {Claims}",
                    currentUserId, roleClaim, allClaims);
                return StatusCode(403, new { Message = "You do not have permission to perform this action. Please ensure you are logged in as HR or Admin." });
            }

            // Policy ensures user is Admin or HR. For HR users, verify they own the job.
            // For Admin users, no ownership check needed - they can view any job's applications.
            if (!isAdmin)
            {
                Log.Debug("GetApplicationsByJob: User is not Admin, performing HR ownership check for JobId {JobId}", jobId);
                // If not Admin, must be HR (policy ensures this), so check ownership
                var job = await _jobRepository.GetByIdAsync(jobId);
                if (job == null)
                {
                    Log.Warning("GetApplicationsByJob: Job with ID {JobId} not found.", jobId);
                    return NotFound(new { Message = $"Job with ID {jobId} not found" });
                }

                Log.Debug("GetApplicationsByJob: Job {JobId} found. CreatedBy: {JobCreatedBy}, CurrentUserId: {CurrentUserId}", 
                    jobId, job.CreatedBy, currentUserId);

                if (!job.CreatedBy.HasValue || job.CreatedBy.Value != currentUserId)
                {
                    Log.Warning("GetApplicationsByJob: HR user {UserId} attempted to view applications for job {JobId} created by {CreatedBy} (unauthorized).",
                        currentUserId, jobId, job.CreatedBy);
                    return StatusCode(403, new { Message = $"You can only view applications for jobs you created. Your ID: {currentUserId}, Job CreatedBy: {job.CreatedBy?.ToString() ?? "null"}" });
                }
                
                Log.Information("GetApplicationsByJob: HR user {UserId} verified ownership of job {JobId} (CreatedBy: {CreatedBy}).",
                    currentUserId, jobId, job.CreatedBy.Value);
            }
            else
            {
                Log.Debug("GetApplicationsByJob: User is Admin, skipping HR ownership check for JobId {JobId}", jobId);
            }

            Log.Information("GetApplicationsByJob: Getting applications for job {JobId} by user {CurrentUserId} (Role: {Role}).",
                jobId, currentUserId, roleClaim);
            var applications = await _jobApplicationService.GetApplicationsByJobAsync(jobId);
            Log.Information("GetApplicationsByJob: Retrieved {ApplicationCount} applications for job {JobId}.", applications.Count(), jobId);
            return Ok(applications);
        }

        /// <summary>
        /// Get all applications submitted by a specific applicant
        /// </summary>
        /// <param name="applicantId">Applicant ID</param>
        /// <returns>List of applications by the applicant</returns>
        /// <response code="200">Returns the list of applications</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role or is trying to view another applicant's applications</response>
        [HttpGet("applicant/{applicantId}")]
        [Authorize] // Changed to [Authorize] to allow the controller's internal authorization logic to execute
        [ProducesResponseType(typeof(List<Applications>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<List<Applications>>> GetApplicationsByApplicant(int applicantId)
        {
            Log.Debug("GetApplicationsByApplicant: Starting request for ApplicantId {ApplicantId}", applicantId);
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                Log.Warning("GetApplicationsByApplicant: Invalid user ID claim for authenticated user.");
                return Unauthorized(new { Message = "Invalid user authentication" });
            }

            // Determine user role using comprehensive checking
            // With MapInboundClaims = false, we need to check all possible claim type variations
            string? roleClaim = null;
            UserRole? userRole = null;
            
            // Log all claims first for debugging
            var allClaimsList = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
            Log.Debug("GetApplicationsByApplicant: All claims for user {UserId}: {Claims}", currentUserId, string.Join(", ", allClaimsList));
            
            // Method 1: Try role_value claim first (numeric, most reliable)
            var roleValueClaim = User.FindFirst("role_value");
            if (roleValueClaim != null && int.TryParse(roleValueClaim.Value, out int roleInt))
            {
                userRole = (UserRole)roleInt;
                roleClaim = userRole.ToString();
                Log.Information("GetApplicationsByApplicant: Resolved role from role_value={RoleValue} -> {Role}", roleInt, userRole);
            }
            
            // Method 2: Try ClaimTypes.Role (standard Microsoft claim type)
            if (userRole == null)
            {
                roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(roleClaim))
                {
                    if (Enum.TryParse<UserRole>(roleClaim, true, out var parsedRole))
                    {
                        userRole = parsedRole;
                        Log.Information("GetApplicationsByApplicant: Resolved role from ClaimTypes.Role={RoleClaim} -> {Role}", roleClaim, userRole);
                    }
                }
            }
            
            // Method 3: Try full URI version of role claim (when MapInboundClaims = false, this might be the actual type)
            if (userRole == null)
            {
                var fullUriRoleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role");
                if (fullUriRoleClaim != null)
                {
                    roleClaim = fullUriRoleClaim.Value;
                    if (Enum.TryParse<UserRole>(roleClaim, true, out var parsedRoleUri))
                    {
                        userRole = parsedRoleUri;
                        Log.Information("GetApplicationsByApplicant: Resolved role from full URI claim={RoleClaim} -> {Role}", roleClaim, userRole);
                    }
                    else if (int.TryParse(roleClaim, out int roleIntUri))
                    {
                        userRole = (UserRole)roleIntUri;
                        roleClaim = userRole.ToString();
                        Log.Information("GetApplicationsByApplicant: Resolved role from full URI claim (numeric)={RoleValue} -> {Role}", roleIntUri, userRole);
                    }
                }
            }
            
            // Method 4: Try simple "role" claim
            if (userRole == null)
            {
                var simpleRoleClaim = User.FindFirst("role");
                if (simpleRoleClaim != null)
                {
                    if (int.TryParse(simpleRoleClaim.Value, out int roleIntSimple))
                    {
                        userRole = (UserRole)roleIntSimple;
                        roleClaim = userRole.ToString();
                        Log.Information("GetApplicationsByApplicant: Resolved role from role (numeric)={RoleValue} -> {Role}", roleIntSimple, userRole);
                    }
                    else if (Enum.TryParse<UserRole>(simpleRoleClaim.Value, true, out var parsedRoleSimple))
                    {
                        userRole = parsedRoleSimple;
                        roleClaim = userRole.ToString();
                        Log.Information("GetApplicationsByApplicant: Resolved role from role (string)={RoleClaim} -> {Role}", simpleRoleClaim.Value, userRole);
                    }
                }
            }
            
            // Method 5: Search all claims for anything containing "role" (case-insensitive)
            if (userRole == null)
            {
                var anyRoleClaim = User.Claims.FirstOrDefault(c => 
                    c.Type.Contains("role", StringComparison.OrdinalIgnoreCase));
                if (anyRoleClaim != null)
                {
                    roleClaim = anyRoleClaim.Value;
                    if (int.TryParse(roleClaim, out int roleIntAny))
                    {
                        userRole = (UserRole)roleIntAny;
                        roleClaim = userRole.ToString();
                        Log.Information("GetApplicationsByApplicant: Resolved role from claim type '{ClaimType}' (numeric)={RoleValue} -> {Role}", 
                            anyRoleClaim.Type, roleIntAny, userRole);
                    }
                    else if (Enum.TryParse<UserRole>(roleClaim, true, out var parsedRoleAny))
                    {
                        userRole = parsedRoleAny;
                        Log.Information("GetApplicationsByApplicant: Resolved role from claim type '{ClaimType}' (string)={RoleClaim} -> {Role}", 
                            anyRoleClaim.Type, roleClaim, userRole);
                    }
                }
            }
            
            // Method 6: Fallback to IsInRole (less reliable with MapInboundClaims = false, but try anyway)
            if (userRole == null)
            {
                if (User.IsInRole(UserRole.Admin.ToString()))
                {
                    userRole = UserRole.Admin;
                    roleClaim = UserRole.Admin.ToString();
                    Log.Information("GetApplicationsByApplicant: Resolved role from IsInRole (Admin)");
                }
                else if (User.IsInRole(UserRole.HR.ToString()))
                {
                    userRole = UserRole.HR;
                    roleClaim = UserRole.HR.ToString();
                    Log.Information("GetApplicationsByApplicant: Resolved role from IsInRole (HR)");
                }
                else if (User.IsInRole(UserRole.Applicant.ToString()))
                {
                    userRole = UserRole.Applicant;
                    roleClaim = UserRole.Applicant.ToString();
                    Log.Information("GetApplicationsByApplicant: Resolved role from IsInRole (Applicant)");
                }
            }
            
            var allClaims = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
            Log.Information("GetApplicationsByApplicant: User {CurrentUserId}, ApplicantId: {ApplicantId}, ResolvedRole: {Role}, RoleClaim: {RoleClaim}, AllClaims: {AllClaims}",
                currentUserId, applicantId, userRole?.ToString() ?? "null", roleClaim ?? "null", allClaims);

            // Check if user has a valid role (Admin, HR, or Applicant)
            // If role detection failed, but user is authenticated and requesting their own applications, allow it
            if (userRole == null)
            {
                // Fallback: If user is requesting their own applications (currentUserId == applicantId), allow it
                // This handles cases where role detection fails but the user is clearly an applicant
                if (currentUserId == applicantId)
                {
                    Log.Warning("GetApplicationsByApplicant: Role detection failed for user {CurrentUserId}, but allowing access since they're requesting their own applications. All claims: {AllClaims}",
                        currentUserId, allClaims);
                    // Continue to allow access - treat as applicant
                    userRole = UserRole.Applicant;
                }
                else
                {
                    Log.Warning("GetApplicationsByApplicant: Unable to determine user role for user {CurrentUserId}. All claims: {AllClaims}",
                        currentUserId, allClaims);
                    return StatusCode(403, new { Message = "Unable to determine user role. Please ensure you are logged in with a valid account." });
                }
            }

            // For Applicant, verify they are viewing their own applications
            if (userRole == UserRole.Applicant)
            {
                if (currentUserId != applicantId)
                {
                    Log.Warning("GetApplicationsByApplicant: Applicant {CurrentUserId} attempted to view applications for applicant {ApplicantId} (unauthorized).",
                        currentUserId, applicantId);
                    return StatusCode(403, new { Message = "You can only view your own applications." });
                }
                Log.Information("GetApplicationsByApplicant: Applicant {CurrentUserId} verified - viewing own applications", currentUserId);
            }
            else if (userRole == UserRole.Admin || userRole == UserRole.HR)
            {
                // Admin/HR can view any applicant's applications
                Log.Information("GetApplicationsByApplicant: {Role} user {CurrentUserId} viewing applications for applicant {ApplicantId}",
                    userRole, currentUserId, applicantId);
            }
            else
            {
                Log.Warning("GetApplicationsByApplicant: User {CurrentUserId} has invalid role {Role}", currentUserId, userRole);
                return StatusCode(403, new { Message = "You do not have permission to view applications." });
            }

            Log.Information("GetApplicationsByApplicant: Getting applications by applicant {ApplicantId} (requested by user {CurrentUserId}, Role: {Role}).",
                applicantId, currentUserId, roleClaim ?? "unknown");
            var applications = await _jobApplicationService.GetApplicationsByApplicantAsync(applicantId);
            Log.Information("GetApplicationsByApplicant: Retrieved {ApplicationCount} applications by applicant {ApplicantId}.", applications.Count(), applicantId);
            return Ok(applications);
        }

        /// <summary>
        /// Get all pending applications that need review
        /// </summary>
        /// <returns>List of pending applications</returns>
        /// <response code="200">Returns the list of pending applications</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role</response>
        [HttpGet("pending")]
        [Authorize(Policy = "AdminOrHROnly")] // Only Admin and HR can view pending applications
        [ProducesResponseType(typeof(List<Applications>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<List<Applications>>> GetPendingApplications()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                Log.Warning("GetPendingApplications: Invalid user ID claim for authenticated user.");
                return Unauthorized(new { Message = "Invalid user authentication" });
            }

            Log.Information("GetPendingApplications: Getting pending applications by user {CurrentUserId} (Role: {Role}).",
                currentUserId, User.FindFirst(ClaimTypes.Role)?.Value);
            var applications = await _jobApplicationService.GetPendingApplicationsAsync();
            Log.Information("GetPendingApplications: Retrieved {ApplicationCount} pending applications.", applications.Count());
            return Ok(applications);
        }

        /*/// <summary>
        /// Review and update the status of a job application
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="request">Review data</param>
        /// <returns>Review result</returns>
        /// <response code="200">Application reviewed successfully</response>
        /// <response code="400">If the request data is invalid</response>
        /// <response code="404">If the application is not found</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role</response>
        [HttpPut("{id}/review")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult> ReviewApplication(int id, request.ReviewerId,request.Status, request.ReviewNotes)
        {
            Log.Information("Reviewing application {ApplicationId} by reviewer {ReviewerId} with status {Status}", id, request.ReviewerId, request.Status);
            
            try
            {
                await _jobApplicationService.ReviewApplicationAsync(
                    id, request.ReviewerId, request.Status, request.ReviewNotes);
                
                Log.Information("Successfully reviewed application {ApplicationId}", id);
                return Ok(new { Message = "Application reviewed successfully" });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error reviewing application {ApplicationId}", id);
                return BadRequest(new { Message = ex.Message });
            }
        }*/
}