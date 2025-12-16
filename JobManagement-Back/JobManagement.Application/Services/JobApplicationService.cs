using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using JobManagement.Application.Interfaces;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;

namespace JobManagement.Application.Services;

public class JobApplicationService
{
    private readonly IJobApplicationRepository _jobApplicationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IJobRepository _jobRepository;

    public JobApplicationService(IJobApplicationRepository jobApplicationRepository, IUserRepository userRepository, IJobRepository jobRepository)
    {
        _jobApplicationRepository = jobApplicationRepository;
        _userRepository = userRepository;
        _jobRepository = jobRepository;
    }

    public async Task<int> SubmitApplicationAsync(Applications application, int applicantId)
    {
        var job = await _jobRepository.GetByIdAsync(application.JobId);
        if (job == null)
            throw new InvalidOperationException("Job not found");
        
        if (job.Status != JobStatus.Active)
                throw new InvalidOperationException("Job is not accepting applications");

        if (job.ApplicationDeadline < DateTime.UtcNow)
                throw new InvalidOperationException("Application deadline has passed");

            // Validate applicant
            var applicant = await _userRepository.GetByIdAsync(applicantId);
            if (applicant == null)
                throw new InvalidOperationException("Applicant not found");

            if (applicant.Role != UserRole.Applicant)
                throw new UnauthorizedAccessException("Only applicants can submit applications");

            // Check if user has already applied
            if (await _jobApplicationRepository.HasUserAppliedAsync(application.JobId, applicantId))
                throw new InvalidOperationException("You have already applied for this job");

            application.ApplicantId = applicantId;
            application.Status = ApplicationStatus.Pending;
            application.AppliedAt = DateTime.UtcNow;
            application.CreatedAt = DateTime.UtcNow;

            return await _jobApplicationRepository.CreateAsync(application);
        }

        public async Task ReviewApplicationAsync(int applicationId, int reviewerId, ApplicationStatus status, string? reviewNotes = null)
        {
            var application = await _jobApplicationRepository.GetByIdAsync(applicationId);
            if (application == null)
                throw new InvalidOperationException("Application not found");

            var reviewer = await _userRepository.GetByIdAsync(reviewerId);
            if (reviewer == null)
                throw new InvalidOperationException("Reviewer not found");

            if (reviewer.Role != UserRole.HR && reviewer.Role != UserRole.Admin)
                throw new UnauthorizedAccessException("Only HR and Admin users can review applications");

            application.Status = status;
            application.ReviewedByUserId = reviewerId;
            application.ReviewedAt = DateTime.UtcNow;
            application.UpdatedAt = DateTime.UtcNow;

            await _jobApplicationRepository.UpdateAsync(application);
        }

        public async Task<IEnumerable<Applications>> GetApplicationsByJobAsync(int jobId) =>
            await _jobApplicationRepository.GetByJobIdAsync(jobId);
        
        public async Task<IEnumerable<Applications>> GetApplicationsByApplicantAsync(int applicantId) => 
             await _jobApplicationRepository.GetByApplicantIdAsync(applicantId);
        

        public async Task<IEnumerable<Applications>> GetPendingApplicationsAsync()  => 
            await _jobApplicationRepository.GetByStatusAsync(ApplicationStatus.Pending); 
}
