using JobManagement.Application.Services;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Security.Claims;
using JobManagement.Application.Dtos;
using JobManagement.Domain.Enums;
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
    [Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(typeof(List<Job>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<List<Job>>> GetAllJobs()
    {
        Log.Information("Getting all jobs. User claims: {Claims}", string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
        var jobs = await _jobService.GetAllJobsAsync();
        Log.Information("Retrieved {JobCount} jobs", jobs.Count);
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
    [Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(typeof(Job), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<Job>> GetJob(int id)
    {
        Log.Information("Getting job with ID: {JobId}. User claims: {Claims}", id, string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
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
    [Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(typeof(int), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<int>> CreateJob([FromBody] CreateJobRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            Log.Information("Creating job. Request: {@Request}, CreatedBy: {CreatedBy}", request, userId);
            var createdJob = await _jobService.CreateJobAsync(request, userId);
            Log.Information("Job created successfully with ID: {JobId}", createdJob.Id);
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
    [Authorize(Roles = "Admin,HR")]
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
    [Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult> DeleteJob(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
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
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            throw new InvalidOperationException("User ID not found in token claims");
        return userId;
    }
}