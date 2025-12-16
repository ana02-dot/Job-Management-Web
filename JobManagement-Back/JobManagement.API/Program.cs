using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Linq;
using JobManagement.API.Helpers;
using JobManagement.Application.Interfaces;
using JobManagement.Application.Services;
using JobManagement.Infrastructure.Configuration;
using JobManagement.Persistence.Data;
using JobManagement.Persistence.Repositories;
using JobManagement.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.Tasks;
using JobManagement.Application.Middlewares;
using JobManagement.Application.Profiles;
using JobManagement.Domain.Enums;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

var preferredPort = builder.Configuration.GetValue("ServerOptions:PreferredPort", 5265);
var httpPort = PortUtility.GetAvailablePort(preferredPort);
builder.WebHost.UseUrls($"http://127.0.0.1:{httpPort}");
builder.Services.AddSingleton(new ServerPortOptions(httpPort));

// Configure Serilog
builder.Host.UseSerilog();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Handle circular references in navigation properties
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = false;
        // Use camelCase for JSON property names to match Angular conventions
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Add services to the container
builder.Services.AddSwaggerConfiguration(builder.Configuration);
builder.Services.AddValidationConfiguration();

builder.Services.AddAutoMapper(typeof(UserProfile));
// Bind JwtSettings from appsettings.json
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
// JWT Authentication Configuration
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = false;
        // Don't map inbound claims to Microsoft-specific types
        // This ensures ClaimTypes.Role is read as set in JwtService
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings?.Issuer,
            ValidAudience = jwtSettings?.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.SecretKey ?? "")),
            ClockSkew = TimeSpan.Zero,
            // Configure claim types for proper role resolution
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };
        
        // This event is crucial for ensuring the role claim is correctly processed
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var claimsIdentity = context.Principal?.Identity as ClaimsIdentity;
                if (claimsIdentity == null)
                {
                    context.Fail("Invalid token.");
                    return;
                }

                // Ensure ClaimTypes.Role is present. If not, try to add it from "role_value" or "role"
                var existingRoleClaim = claimsIdentity.FindFirst(ClaimTypes.Role);
                if (existingRoleClaim == null)
                {
                    var roleValueClaim = claimsIdentity.FindFirst("role_value") ?? claimsIdentity.FindFirst("role");
                    if (roleValueClaim != null)
                    {
                        // Try to parse the role value
                        string roleName = roleValueClaim.Value;
                        if (int.TryParse(roleValueClaim.Value, out int roleInt))
                        {
                            // Convert numeric value to enum name (0=Admin, 1=HR, 2=Applicant)
                            roleName = ((UserRole)roleInt).ToString();
                        }
                        // Add the role claim - this makes it accessible via IsInRole
                        // Use the standard ClaimTypes.Role so it works with IsInRole
                        claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, roleName));
                    }
                    else
                    {
                        // Log all claims for debugging
                        var allClaimTypes = string.Join(", ", claimsIdentity.Claims.Select(c => c.Type));
                        Serilog.Log.Warning("OnTokenValidated: No role information found in token. Available claim types: {ClaimTypes}", allClaimTypes);
                        context.Fail("No role information found in token.");
                        return;
                    }
                }
                else
                {
                    // Verify the role claim is valid
                    var roleValue = existingRoleClaim.Value;
                    if (!Enum.TryParse<UserRole>(roleValue, true, out _) && !int.TryParse(roleValue, out int roleInt))
                    {
                        Serilog.Log.Warning("OnTokenValidated: Invalid role claim value: {RoleValue}", roleValue);
                    }
                }
            },
            OnAuthenticationFailed = context =>
            {
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Basic role policies
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(UserRole.Admin.ToString()));
    options.AddPolicy("HROnly", policy => policy.RequireRole(UserRole.HR.ToString()));
    
    // ApplicantOnly policy with robust role checking
    options.AddPolicy("ApplicantOnly", policy =>
        policy.RequireAssertion(context =>
        {
            // First try IsInRole (should work if role claim is properly set)
            if (context.User.IsInRole(UserRole.Applicant.ToString()))
            {
                return true;
            }
            
            // Fallback: Check role claim directly
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(roleClaim))
            {
                if (roleClaim.Equals(UserRole.Applicant.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            
            // Last resort: Check role_value claim
            var roleValueClaim = context.User.FindFirst("role_value");
            if (roleValueClaim != null && int.TryParse(roleValueClaim.Value, out int roleInt))
            {
                var role = (UserRole)roleInt;
                return role == UserRole.Applicant;
            }
            
            // Also check for "role" claim (without ClaimTypes prefix)
            var simpleRoleClaim = context.User.FindFirst("role");
            if (simpleRoleClaim != null)
            {
                if (int.TryParse(simpleRoleClaim.Value, out int roleInt2))
                {
                    var role = (UserRole)roleInt2;
                    return role == UserRole.Applicant;
                }
                if (simpleRoleClaim.Value.Equals(UserRole.Applicant.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            
            return false;
        }));
    
    options.AddPolicy("AdminOrHR", policy => policy.RequireRole(UserRole.Admin.ToString(), UserRole.HR.ToString()));
    
    // Policy for Admin or HR to view applications for jobs
    // Use RequireAssertion with IsInRole check (more reliable with MapInboundClaims = false)
    options.AddPolicy("AdminOrHROnly", policy =>
        policy.RequireAssertion(context =>
        {
            // First try IsInRole (should work if role claim is properly set)
            if (context.User.IsInRole(UserRole.Admin.ToString()) || 
                context.User.IsInRole(UserRole.HR.ToString()))
            {
                return true;
            }
            
            // Fallback: Check role claim directly
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(roleClaim))
            {
                return roleClaim.Equals(UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase) ||
                       roleClaim.Equals(UserRole.HR.ToString(), StringComparison.OrdinalIgnoreCase);
            }
            
            // Last resort: Check role_value claim
            var roleValueClaim = context.User.FindFirst("role_value");
            if (roleValueClaim != null && int.TryParse(roleValueClaim.Value, out int roleInt))
            {
                var role = (UserRole)roleInt;
                return role == UserRole.Admin || role == UserRole.HR;
            }
            
            return false;
        }));
    
    // Policy for Applicant to view their own applications, or Admin/HR to view any
    options.AddPolicy("ApplicantOrAdminOrHROwns", policy =>
        policy.RequireAssertion(context =>
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
            {
                return false;
            }

            // Check role claim directly (more reliable than IsInRole)
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(roleClaim))
            {
                // Fallback: try to find role from alternative claim names
                roleClaim = context.User.FindFirst("role_value")?.Value;
                if (!string.IsNullOrEmpty(roleClaim) && int.TryParse(roleClaim, out int roleInt))
                {
                    roleClaim = ((UserRole)roleInt).ToString();
                }
            }

            if (string.IsNullOrEmpty(roleClaim))
            {
                return false;
            }

            // Admin/HR can view any
            if (roleClaim.Equals(UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase) ||
                roleClaim.Equals(UserRole.HR.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // For Applicant, the controller will check if currentUserId == applicantId
            if (roleClaim.Equals(UserRole.Applicant.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }));
});

// Database
        builder.Services.AddDbContext<JobManagementDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "https://localhost:4200"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials() 
            .SetIsOriginAllowed(origin => true);
    });
});
// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IJobApplicationRepository, JobApplicationRepository>();

// Services
builder.Services.AddScoped<JobApplicationService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHttpClient<PhoneValidationService>();

var app = builder.Build();

var portOptions = app.Services.GetRequiredService<ServerPortOptions>();

// Middleware pipeline
app.UseSwaggerConfiguration();

app.UseCors("AllowAngularApp");

app.UseRouting();
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/__system/port", (ServerPortOptions options) => Results.Ok(new { options.HttpPort }));

app.Run();