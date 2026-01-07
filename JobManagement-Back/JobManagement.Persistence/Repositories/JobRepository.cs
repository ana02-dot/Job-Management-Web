using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using JobManagement.Application.Dtos;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using JobManagement.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace JobManagement.Persistence.Repositories;

public class JobRepository : IJobRepository
{
    private readonly JobManagementDbContext _context;

    public JobRepository(JobManagementDbContext context)
    {
        _context = context;
    }
    public async Task<Job?> GetByIdAsync(int id)
    {
        return await _context.Jobs
            .Include(j => j.Creator)
            .Include(j => j.Applications)
            .Where(j => j.IsDeleted != 1)
            .FirstOrDefaultAsync(j => j.Id == id);
    }

    public async Task<List<Job>> GetAllAsync()
    {
        return await _context.Jobs
            .Include(j => j.Creator)
            .Where(j => j.IsDeleted != 1)
            .ToListAsync();
    }

    public async Task<List<Job>> GetByCreatorAsync(int createdBy)
    {
        var jobs = await _context.Jobs
            .Include(j => j.Creator)
            .Where(j => j.CreatedBy.HasValue && j.CreatedBy.Value == createdBy && j.IsDeleted != 1)
            .ToListAsync();
        return jobs;
    }

    public async Task<List<Job>> GetByStatusAsync(JobStatus status)
    {
        return await _context.Jobs
            .Where(j => j.Status == status && j.IsDeleted != 1) 
            .ToListAsync();
    }

    public async Task<Job> CreateAsync(Job job)
    {
        if (!job.CreatedBy.HasValue || job.CreatedBy.Value == 0)
        {
            throw new InvalidOperationException($"Cannot create job: CreatedBy (FK to User.Id) must be set to a valid user ID. Current value: {job.CreatedBy}");
        }
        
        _context.Jobs.Add(job);
        
        _context.Entry(job).Property(j => j.CreatedBy).IsModified = true;
        
        await _context.SaveChangesAsync();
        return job;
    }

    public async Task UpdateAsync(Job job)
    {
        var title = job.Title;
        var description = job.Description;
        var requirements = job.Requirements;
        var salary = job.Salary;
        var location = job.Location;
        var status = job.Status;
        var applicationDeadline = job.ApplicationDeadline;
        var workType = job.WorkType;
        var category = job.Category;
        var updatedAt = job.UpdatedAt;
        
        var rowsAffected = await _context.Jobs
            .Where(j => j.Id == job.Id && j.IsDeleted != 1)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(j => j.Title, _ => title)
                .SetProperty(j => j.Description, _ => description)
                .SetProperty(j => j.Requirements, _ => requirements)
                .SetProperty(j => j.Salary, _ => salary)
                .SetProperty(j => j.Location, _ => location)
                .SetProperty(j => j.Status, _ => status)
                .SetProperty(j => j.ApplicationDeadline, _ => applicationDeadline)
                .SetProperty(j => j.WorkType, _ => workType)
                .SetProperty(j => j.Category, _ => category)
                .SetProperty(j => j.UpdatedAt, _ => updatedAt));
        
        if (rowsAffected == 0)
        {
            throw new InvalidOperationException($"Job with ID {job.Id} not found or could not be updated");
        }
        
        var updated = await _context.Jobs
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == job.Id && j.IsDeleted != 1);
        
        if (updated != null)
        {
            job.Title = updated.Title;
            job.Description = updated.Description;
            job.Requirements = updated.Requirements;
            job.Salary = updated.Salary;
            job.Location = updated.Location;
            job.Status = updated.Status;
            job.ApplicationDeadline = updated.ApplicationDeadline;
            job.WorkType = updated.WorkType;
            job.Category = updated.Category;
            job.UpdatedAt = updated.UpdatedAt;
        }
    }

    public async Task DeleteAsync(int id)
    {
        var job = await GetByIdAsync(id);
        if (job != null)
        {
            job.IsDeleted = 1;
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<int> CloseExpiredJobsAsync()
    {
        var now = DateTime.UtcNow;
        var expiredJobs = await _context.Jobs
            .Where(j => j.IsDeleted != 1 
                && j.Status == JobStatus.Active 
                && j.ApplicationDeadline < now)
            .ToListAsync();

        foreach (var job in expiredJobs)
        {
            job.Status = JobStatus.Closed;
            job.UpdatedAt = now;
        }

        if (expiredJobs.Any())
        {
            await _context.SaveChangesAsync();
        }

        return expiredJobs.Count;
    }
}