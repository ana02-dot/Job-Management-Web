using JobManagement.Application.Services;
using JobManagement.Application.Dtos;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Security.Claims;

namespace JobManagement.API.Controllers;
[ApiController]
[Route("api/[controller]")]
    public class JobApplicationController : ControllerBase
    {
        private readonly JobApplicationService _jobApplicationService;
        private readonly IJobRepository _jobRepository;
        private readonly IUserRepository _userRepository;
        private readonly ICloudStorageService _cloudStorageService;

        public JobApplicationController(
            JobApplicationService jobApplicationService, 
            IJobRepository jobRepository,
            IUserRepository userRepository,
            ICloudStorageService cloudStorageService)
        {
            _jobApplicationService = jobApplicationService;
            _jobRepository = jobRepository;
            _userRepository = userRepository;
            _cloudStorageService = cloudStorageService;
        }
    /// <summary>
    /// Submit a new job application
    /// </summary>
    /// <param name="request">Application submission data</param>
    /// <returns>Application submission result</returns>
    /// <response code="200">Application submitted successfully</response>
    /// <response code="400">If the request data is invalid</response>
    [HttpPost("submit")]
    [Authorize(Policy = "ApplicantOnly")]
    [Produces("application/json")]
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

        if (request == null)
        {
            return BadRequest(new { Message = "Request body is required." });
        }

        Log.Information("SubmitApplication - User ID: {UserId}, Job ID: {JobId}", applicantId, request.JobId);
        
        try
        {
            var applicant = await _userRepository.GetByIdAsync(applicantId);
            if (applicant == null)
            {
                Log.Warning("SubmitApplication: Applicant {ApplicantId} not found", applicantId);
                return BadRequest(new { Message = "Applicant not found" });
            }

            if (string.IsNullOrWhiteSpace(applicant.CvUrl))
            {
                Log.Warning("SubmitApplication: User {UserId} attempted to apply without uploading a CV", applicantId);
                return BadRequest(new { 
                    Message = "CV is required to submit an application. Please upload your CV in your profile before applying for jobs.",
                    ErrorCode = "CV is required",
                });
            }

            var application = new Applications
            {
                JobId = request.JobId,
                CoverLetter = request.CoverLetter ?? string.Empty
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
        [Authorize]
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

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var roleValueClaim = User.FindFirst("role_value")?.Value;
            
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

            if (!isAdmin && !isHR)
            {
                Log.Error("GetApplicationsByJob: User {UserId} is neither Admin nor HR. RoleClaim: {RoleClaim}, All claims: {Claims}",
                    currentUserId, roleClaim, allClaims);
                return StatusCode(403, new { Message = "You do not have permission to perform this action. Please ensure you are logged in as HR or Admin." });
            }

            if (!isAdmin)
            {
                Log.Debug("GetApplicationsByJob: User is not Admin, performing HR ownership check for JobId {JobId}", jobId);
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

            var userRole = GetUserRoleFromClaims();
            
            var allClaims = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
            Log.Information("GetApplicationsByApplicant: User {CurrentUserId}, ApplicantId: {ApplicantId}, ResolvedRole: {Role}, AllClaims: {AllClaims}",
                currentUserId, applicantId, userRole?.ToString() ?? "null", allClaims);

            if (userRole == null)
            {
                if (currentUserId == applicantId)
                {
                    Log.Warning("GetApplicationsByApplicant: Role detection failed for user {CurrentUserId}, but allowing access since they're requesting their own applications. All claims: {AllClaims}",
                        currentUserId, allClaims);
                    userRole = UserRole.Applicant;
                }
                else
                {
                    Log.Warning("GetApplicationsByApplicant: Unable to determine user role for user {CurrentUserId}. All claims: {AllClaims}",
                        currentUserId, allClaims);
                    return StatusCode(403, new { Message = "Unable to determine user role. Please ensure you are logged in with a valid account." });
                }
            }

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
                Log.Information("GetApplicationsByApplicant: {Role} user {CurrentUserId} viewing applications for applicant {ApplicantId}",
                    userRole, currentUserId, applicantId);
            }
            else
            {
                Log.Warning("GetApplicationsByApplicant: User {CurrentUserId} has invalid role {Role}", currentUserId, userRole);
                return StatusCode(403, new { Message = "You do not have permission to view applications." });
            }

            Log.Information("GetApplicationsByApplicant: Getting applications by applicant {ApplicantId} (requested by user {CurrentUserId}, Role: {Role}).",
                applicantId, currentUserId, userRole?.ToString() ?? "unknown");
            var applications = await _jobApplicationService.GetApplicationsByApplicantAsync(applicantId);
            Log.Information("GetApplicationsByApplicant: Retrieved {ApplicationCount} applications by applicant {ApplicantId}.", applications.Count(), applicantId);
            return Ok(applications);
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

        /// <summary>
        /// Update the status of a job application
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="request">Status update data</param>
        /// <returns>Status update result</returns>
        /// <response code="200">Application status updated successfully</response>
        /// <response code="400">If the request data is invalid</response>
        /// <response code="404">If the application is not found</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role</response>
        [HttpPut("{id}/status")]
        [Authorize(Policy = "AdminOrHROnly")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusRequest request)
        {
            if (request == null)
            {
                Log.Warning("UpdateApplicationStatus: Request body is null for application {ApplicationId}", id);
                return BadRequest(new { Message = "Request body is required" });
            }

            Log.Information("UpdateApplicationStatus: Endpoint hit for application {ApplicationId} with status {Status}", id, request.Status);
            
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int reviewerId))
            {
                Log.Warning("UpdateApplicationStatus: Invalid user ID claim for authenticated user.");
                return Unauthorized(new { Message = "Invalid user authentication" });
            }

            if (!Enum.IsDefined(typeof(ApplicationStatus), request.Status))
            {
                Log.Warning("UpdateApplicationStatus: Invalid status value {Status} for application {ApplicationId}", request.Status, id);
                return BadRequest(new { Message = $"Invalid status value. Valid values are: {string.Join(", ", Enum.GetValues(typeof(ApplicationStatus)).Cast<int>())}" });
            }

            var status = (ApplicationStatus)request.Status;
            
            Log.Information("UpdateApplicationStatus: Updating application {ApplicationId} by reviewer {ReviewerId} with status {Status}", id, reviewerId, status);
            
            try
            {
                await _jobApplicationService.ReviewApplicationAsync(id, reviewerId, status);
                
                Log.Information("Successfully updated status for application {ApplicationId} to {Status}", id, status);
                return Ok(new { Message = "Application status updated successfully" });
            }
            catch (InvalidOperationException ex)
            {
                Log.Warning(ex, "UpdateApplicationStatus: Invalid operation for application {ApplicationId}", id);
                if (ex.Message.Contains("not found"))
                {
                    return NotFound(new { Message = ex.Message });
                }
                return BadRequest(new { Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                Log.Warning(ex, "UpdateApplicationStatus: Unauthorized attempt to update application {ApplicationId}", id);
                return StatusCode(403, new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "UpdateApplicationStatus: Error updating status for application {ApplicationId}", id);
                return StatusCode(500, new { Message = "An unexpected error occurred while updating the application status." });
            }
        }
}