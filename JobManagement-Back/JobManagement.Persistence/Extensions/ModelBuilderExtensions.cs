using JobManagement.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace JobManagement.Persistence.Extensions;

public static class ModelBuilderExtensions
{
    public static void ConfigureBaseEntity<T>(this ModelBuilder modelBuilder) where T : BaseEntity
    {
        modelBuilder.Entity<T>(entity =>
        {
            entity.Property(e => e.Id).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.IsDeleted).HasDefaultValue(0);
        });
    }
}