using JobManagement.Application.Dtos;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using Microsoft.AspNetCore.Http.HttpResults;

namespace JobManagement.Application.Services;

public class JobService : IJobService
{
    private readonly IJobRepository _jobRepository;
    private readonly IUserRepository _userRepository;
    
    public JobService(IJobRepository jobRepository, IUserRepository userRepository)
    {
        _jobRepository = jobRepository;
        _userRepository = userRepository;
    }

     public async Task<Job> CreateJobAsync(CreateJobRequest request, int createdBy)
    {
        // Validate creator
        var creator = await _userRepository.GetByIdAsync(createdBy);
        if (creator == null)
            throw new InvalidOperationException("Creator not found");
        
        if (creator.Role != UserRole.HR && creator.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only HR and Admin users can create jobs");

        var job = new Job
        {
            Title = request.Title,
            Description = request.Description,
            Requirements = request.Requirements,
            Salary = request.Salary,
            Location = request.Location,
            ApplicationDeadline = request.ApplicationDeadline,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Status = JobStatus.Active,
            Creator = null
        };

        var createdJob = await _jobRepository.CreateAsync(job);
        return createdJob;
    }

    public async Task<Job?> GetJobByIdAsync(int id) =>
         await _jobRepository.GetByIdAsync(id);

    public async Task<List<Job>> GetAllJobsAsync()
    {
        var returnedJobs = await _jobRepository.GetAllAsync();
        return returnedJobs.ToList();
    }

    public async Task<List<Job>> GetJobsByStatusAsync(JobStatus status) =>
        await _jobRepository.GetByStatusAsync(status);

    public async Task UpdateJobAsync(int id, CreateJobRequest request, int updaterId)

    {

        var existingJob = await _jobRepository.GetByIdAsync(id);

        if (existingJob == null)

            throw new InvalidOperationException("Job not found");

 

        var updater = await _userRepository.GetByIdAsync(updaterId);

        if (updater == null)

            throw new InvalidOperationException("Updater not found");

 

        if (updater.Role != UserRole.Admin && updater.Role != UserRole.HR)

            throw new UnauthorizedAccessException("Insufficient permissions to update job");

 

        // Update job properties from request

        existingJob.Title = request.Title;

        existingJob.Description = request.Description;

        existingJob.Requirements = request.Requirements;

        existingJob.Salary = request.Salary;

        existingJob.Location = request.Location;

        existingJob.ApplicationDeadline = request.ApplicationDeadline;

        existingJob.UpdatedAt = DateTime.UtcNow;

        existingJob.UpdatedBy = updater.Email;

 

        await _jobRepository.UpdateAsync(existingJob);

    }

 

    public async Task DeleteJobAsync(int id, int deleterId)

    {

        var existingJob = await _jobRepository.GetByIdAsync(id);

        if (existingJob == null)

            throw new InvalidOperationException("Job not found");

 

        var deleter = await _userRepository.GetByIdAsync(deleterId);

        if (deleter == null)

            throw new InvalidOperationException("User not found");

 

        if (deleter.Role != UserRole.Admin && deleter.Role != UserRole.HR)

            throw new UnauthorizedAccessException("Insufficient permissions to delete job");

 

        await _jobRepository.DeleteAsync(id);

    }
}