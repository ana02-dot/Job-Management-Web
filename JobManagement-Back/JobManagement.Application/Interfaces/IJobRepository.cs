using JobManagement.Application.Dtos;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;

namespace JobManagement.Application.Interfaces;

public interface IJobRepository
{
    Task<Job?> GetByIdAsync(int id);
    Task<List<Job>> GetAllAsync();
    Task<List<Job>> GetByStatusAsync(JobStatus status);
    Task<Job> CreateAsync(Job job);
    Task UpdateAsync(Job job);
    Task DeleteAsync(int id);
}