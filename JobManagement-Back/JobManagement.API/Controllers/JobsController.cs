using JobManagement.Application.Services;
using JobManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.ComponentModel.DataAnnotations;
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
            return NotFound();
        }
        Log.Information("Successfully retrieved job {JobId}: {JobTitle}", id, job.Title);
        return Ok(job);
    }

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
            Log.Information("Creating job. Request: {@Request}", request);
            var userId = GetCurrentUserId();
            Log.Information("User ID from token: {UserId}", userId);
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

    private int GetCurrentUserId()
    {
        // Log all claims for debugging
        Log.Information("All claims in token: {Claims}", string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

        // Try multiple claim types that might contain the user ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst("nameid")?.Value
                          ?? User.FindFirst("sub")?.Value
                          ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            Log.Error("User ID not found in token claims. Available claims: {Claims}",
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            throw new InvalidOperationException("User ID not found in token claims");
        }
        return userId;
    }
}