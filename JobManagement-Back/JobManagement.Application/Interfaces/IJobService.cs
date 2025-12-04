using JobManagement.Application.Dtos;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;

namespace JobManagement.Application.Interfaces;

public interface IJobService
{
    Task<Job> CreateJobAsync(CreateJobRequest request, int createdBy);
    Task<Job?> GetJobByIdAsync(int id);
    Task<List<Job>> GetAllJobsAsync();
    Task<List<Job>> GetJobsByStatusAsync(JobStatus status);
    Task UpdateJobAsync(int id, CreateJobRequest request, int updaterId);
    Task DeleteJobAsync(int id, int deleterId);}