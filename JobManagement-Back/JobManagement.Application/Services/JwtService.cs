using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JobManagement.Domain.Entities;
using JobManagement.Domain.Enums;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JobManagement.Application.Services;

public class JwtService : IJwtService
{
    private readonly JwtSettings _jwtSettings;

        public JwtService(IOptions<JwtSettings> jwtSettings)
        {
            _jwtSettings = jwtSettings.Value;
        }

        public string GenerateToken(User user)
        {
            // Get role as both string name and numeric value for compatibility
            // UserRole enum: Admin = 0, HR = 1, Applicant = 2
            var roleName = user.Role.ToString(); // Returns "Admin", "HR", or "Applicant"
            var roleNumericValue = (int)user.Role; // Returns 0, 1, or 2
            var roleValueString = roleNumericValue.ToString(); // Convert to string: "0", "1", or "2"
            
            // Log for debugging
            System.Diagnostics.Debug.WriteLine($"JWT Token Generation - User ID: {user.Id}, User Email: {user.Email}");
            System.Diagnostics.Debug.WriteLine($"  Role enum: {user.Role} ({typeof(UserRole).Name})");
            System.Diagnostics.Debug.WriteLine($"  Role name (ToString): {roleName}");
            System.Diagnostics.Debug.WriteLine($"  Role numeric value: {roleNumericValue}");
            System.Diagnostics.Debug.WriteLine($"  Role value string: {roleValueString}");
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, roleName), // "Admin", "HR", or "Applicant"
                new Claim("role_value", roleValueString), // "0", "1", or "2"
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };
            
            System.Diagnostics.Debug.WriteLine($"  Claims created: {claims.Count} total");
            foreach (var claim in claims)
            {
                System.Diagnostics.Debug.WriteLine($"    - {claim.Type}: {claim.Value}");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtSettings.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch
            {
                return false;
            }
        }
}