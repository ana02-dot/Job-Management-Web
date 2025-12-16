using System;
using JobManagement.Domain.Entities;

namespace JobManagement.Domain.Common;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int IsDeleted { get; set; } = 0;
    public virtual User? Creator { get; set; }
}