using JobManagement.Application.Services;
using JobManagement.Application.Dtos;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.ComponentModel.DataAnnotations;

namespace JobManagement.API.Controllers;
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class JobApplicationController : ControllerBase
{
    private readonly JobApplicationService _jobApplicationService;

    public JobApplicationController(JobApplicationService jobApplicationService)
    {
        _jobApplicationService = jobApplicationService;
    }
    /// <summary>
    /// Submit a new job application
    /// </summary>
    /// <param name="request">Application submission data</param>
    /// <returns>Application submission result</returns>
    /// <response code="200">Application submitted successfully</response>
    /// <response code="400">If the request data is invalid</response>
    [HttpPost("submit")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApplicationSubmissionResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ApplicationSubmissionResponse>> SubmitApplication([FromBody] ApplicationSubmissionRequest request)
    {
        Log.Information("Submitting application for job {JobId} by applicant {ApplicantId}", request.JobId, request.ApplicantId);
        var application = new Applications
        {
            JobId = request.JobId,
            Resume = request.Resume ?? string.Empty,
        };
        var applicationId = await _jobApplicationService.SubmitApplicationAsync(application, request.ApplicantId);
        Log.Information("Successfully submitted application {ApplicationId} for job {JobId}", applicationId, request.JobId);
        return Ok(new ApplicationSubmissionResponse
        {
            ApplicationId = applicationId,
            Message = "Application submitted successfully"
        });
    }

        /// <summary>
        /// Get all applications for a specific job
        /// </summary>
        /// <param name="jobId">Job ID</param>
        /// <returns>List of applications for the job</returns>
        /// <response code="200">Returns the list of applications</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role</response>
        [HttpGet("job/{jobId}")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(List<Applications>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<List<Applications>>> GetApplicationsByJob(int jobId)
        {
            Log.Information("Getting applications for job {JobId}", jobId);
            var applications = await _jobApplicationService.GetApplicationsByJobAsync(jobId);
            Log.Information("Retrieved {ApplicationCount} applications for job {JobId}", applications.Count(), jobId);
            return Ok(applications);
        }

        /// <summary>
        /// Get all applications submitted by a specific applicant
        /// </summary>
        /// <param name="applicantId">Applicant ID</param>
        /// <returns>List of applications by the applicant</returns>
        /// <response code="200">Returns the list of applications</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="403">If the user does not have required role</response>
        [HttpGet("applicant/{applicantId}")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(List<Applications>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<List<Applications>>> GetApplicationsByApplicant(int applicantId)
        {
            Log.Information("Getting applications by applicant {ApplicantId}", applicantId);
            var applications = await _jobApplicationService.GetApplicationsByApplicantAsync(applicantId);
            Log.Information("Retrieved {ApplicationCount} applications by applicant {ApplicantId}", applications.Count(), applicantId);
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
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(List<Applications>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<ActionResult<List<Applications>>> GetPendingApplications()
        {
            Log.Information("Getting pending applications");
            var applications = await _jobApplicationService.GetPendingApplicationsAsync();
            Log.Information("Retrieved {ApplicationCount} pending applications", applications.Count());
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