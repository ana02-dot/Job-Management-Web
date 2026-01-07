using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace JobManagement.Persistence.Data;

public class JobManagementDbContext : DbContext
{
    public JobManagementDbContext(DbContextOptions<JobManagementDbContext> options) : base(options)
    {
    }
    
    public DbSet<Job> Jobs { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Applications> JobApplications { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // ===== USER ENTITY =====
        modelBuilder.Entity<User>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);
            
            // Base Entity Properties
            entity.Property(e => e.Id).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(0);
            
            // User-specific Properties
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PhoneNumber).HasMaxLength(50);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).HasConversion<int>();
            entity.Property(e => e.IsEmailVerified).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.EmailVerifiedAt).IsRequired(false);
            entity.Property(e => e.CvUrl).HasMaxLength(500).IsRequired(false);

            // Navigation properties configuration
            entity.HasMany(u => u.Applications)
                .WithOne(a => a.Applicant)
                .HasForeignKey(a => a.ApplicantId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(u => u.ReviewedApplications)
                .WithOne(a => a.ReviewedBy)
                .HasForeignKey(a => a.ReviewedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(u => u.CreatedJobs)
                .WithOne(j => j.Creator)
                .HasForeignKey(j => j.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction);

            // Indexes
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
        });

        // ===== JOB ENTITY =====
        modelBuilder.Entity<Job>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);
            
            // Base Entity Properties
            entity.Property(e => e.Id).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(0);
            
            // Job-specific Properties
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Requirements).IsRequired();
            entity.Property(e => e.Location).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.Salary).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ApplicationDeadline).IsRequired();
            entity.Property(e => e.WorkType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedBy).IsRequired(false);

            // Navigation properties configuration
            entity.HasMany(j => j.Applications)
                .WithOne(a => a.Job)
                .HasForeignKey(a => a.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== APPLICATIONS ENTITY =====
        modelBuilder.Entity<Applications>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);
            
            // Base Entity Properties
            entity.Property(e => e.Id).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(0);
            
            // Applications-specific Properties
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.ReviewedByUserId).IsRequired(false);
            entity.Property(e => e.ApplicantId).IsRequired();
            entity.Property(e => e.JobId).IsRequired();
            entity.Property(e => e.CoverLetter)
                .IsRequired()
                .HasColumnName("Resume");
            entity.Ignore(e => e.CvFilePath);

            // Unique constraint
            entity.HasIndex(e => new { e.JobId, e.ApplicantId }).IsUnique();
        });
    }
}