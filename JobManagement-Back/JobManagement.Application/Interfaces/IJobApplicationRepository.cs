using System.Collections.Generic;
using System.Threading.Tasks;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;

namespace JobManagement.Application.Interfaces;

public interface IJobApplicationRepository
{
    Task<Applications?> GetByIdAsync(int id);
    Task<IEnumerable<Applications>> GetByJobIdAsync(int jobId);
    Task<IEnumerable<Applications>> GetByApplicantIdAsync(int applicantId);
    Task<IEnumerable<Applications>> GetByStatusAsync(ApplicationStatus status);
    Task<int> CreateAsync(Applications application);
    Task UpdateAsync(Applications application);
    Task DeleteAsync(int id);
    Task<bool> HasUserAppliedAsync(int jobId, int userId);
}