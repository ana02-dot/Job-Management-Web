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
        return await _context.Jobs
            .Include(j => j.Creator)
            .Where(j => j.CreatedBy == createdBy && j.IsDeleted != 1)
            .ToListAsync();
    }

    public async Task<List<Job>> GetByStatusAsync(JobStatus status)
    {
        return await _context.Jobs
            .Where(j => j.Status == status && j.IsDeleted != 1) 
            .ToListAsync();
    }

    public async Task<Job> CreateAsync(Job job)
    {
        // Ensure CreatedBy foreign key is set to User.Id
        if (!job.CreatedBy.HasValue || job.CreatedBy.Value == 0)
        {
            throw new InvalidOperationException($"Cannot create job: CreatedBy (FK to User.Id) must be set to a valid user ID. Current value: {job.CreatedBy}");
        }
        
        // Add job to context - CreatedBy will be saved as foreign key to Users.Id
        _context.Jobs.Add(job);
        
        // Explicitly mark CreatedBy as modified to ensure EF saves it as the foreign key
        _context.Entry(job).Property(j => j.CreatedBy).IsModified = true;
        
        await _context.SaveChangesAsync();
        return job;
    }

    public async Task UpdateAsync(Job job)
    {
        _context.Jobs.Update(job);
        await _context.SaveChangesAsync();
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
}