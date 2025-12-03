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
    //[Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(typeof(List<Job>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<List<Job>>> GetAllJobs()
    {
        Log.Information("Getting all jobs");
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
    //[Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(typeof(Job), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
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
    /// <param name="createdBy">User ID creating the job (from query parameter for testing)</param>
    /// <returns>Created job ID</returns>
    /// <response code="201">Job created successfully</response>
    /// <response code="400">If the request data is invalid</response>
    [HttpPost]
    //[Authorize(Roles = "Admin,HR")]
    [ProducesResponseType(typeof(int), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<int>> CreateJob([FromBody] CreateJobRequest request, [FromQuery] int createdBy = 1)
    {
        try
        {
            Log.Information("Creating job. Request: {@Request}, CreatedBy: {CreatedBy}", request, createdBy);
            var createdJob = await _jobService.CreateJobAsync(request, createdBy);
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
}