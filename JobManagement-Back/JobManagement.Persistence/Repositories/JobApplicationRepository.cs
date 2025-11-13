using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using JobManagement.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace JobManagement.Persistence.Repositories;

public class JobApplicationRepository : IJobApplicationRepository
{
    private readonly JobManagementDbContext _context;

    public JobApplicationRepository(JobManagementDbContext context)
    {
        _context = context;
    }
    public async Task<Applications?> GetByIdAsync(int id)
        {
            return await _context.JobApplications
                .Include(ja => ja.Job)
                .Include(ja => ja.Applicant)
                .Include(ja => ja.ReviewedBy)
                .Where(ja => ja.IsDeleted != 0)
                .FirstOrDefaultAsync(ja => ja.Id == id);
        }

        public async Task<IEnumerable<Applications>> GetByJobIdAsync(int jobId)
        {
            return await _context.JobApplications
                .Include(ja => ja.Applicant)
                .Include(ja => ja.ReviewedBy)
                .Where(ja => ja.IsDeleted != 0 && ja.JobId == jobId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Applications>> GetByApplicantIdAsync(int applicantId)
        {
            return await _context.JobApplications
                .Include(ja => ja.Job)
                .Include(ja => ja.ReviewedBy)
                .Where(ja => ja.IsDeleted != 0 && ja.ApplicantId == applicantId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Applications>> GetByStatusAsync(ApplicationStatus status)
        {
            return await _context.JobApplications
                .Include(ja => ja.Job)
                .Include(ja => ja.Applicant)
                .Where(ja => ja.IsDeleted != 0 && ja.Status == status)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(Applications application)
        {
            _context.JobApplications.Add(application);
            await _context.SaveChangesAsync();
            return application.Id;
        }

        public async Task UpdateAsync(Applications application)
        {
            _context.JobApplications.Update(application);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var application = await GetByIdAsync(id);
            if (application != null)
            {
                application.IsDeleted = 1;
                application.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasUserAppliedAsync(int jobId, int userId)
        {
            return await _context.JobApplications
                .Where(ja => ja.IsDeleted != 0)
                .AnyAsync(ja => ja.JobId == jobId && ja.ApplicantId == userId);
        }
}