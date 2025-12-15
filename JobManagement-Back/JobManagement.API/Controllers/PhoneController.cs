using JobManagement.Application.Interfaces;
using JobManagement.Application.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace JobManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PhoneController : ControllerBase
{
    private readonly IPhoneVerificationService _phoneVerificationService;

    public PhoneController(IPhoneVerificationService phoneVerificationService)
    {
        _phoneVerificationService = phoneVerificationService;
    }

    /// <summary>
    /// Request OTP for phone number verification
    /// </summary>
    /// <param name="request">Phone number</param>
    /// <returns>OTP request result</returns>
    [HttpPost("request-otp")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RequestOtpResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<RequestOtpResponse>> RequestOtp([FromBody] RequestOtpRequest request)
    {
        try
        {
            // Validate phone number format
            if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                return BadRequest(new { Message = "Phone number is required" });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.PhoneNumber, @"^\+995\d{9}$"))
            {
                return BadRequest(new { Message = "Phone number must be +995 followed by 9 digits" });
            }

            Log.Information("Requesting OTP for phone number: {PhoneNumber}", request.PhoneNumber);

            // Generate and send OTP
            var otpCode = await _phoneVerificationService.GenerateAndSendOtpAsync(request.PhoneNumber);

            // In development, return the OTP code. In production, remove this and only send via SMS
            var response = new RequestOtpResponse
            {
                Success = true,
                Message = "OTP sent successfully",
                OtpCode = otpCode // Remove this in production
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error requesting OTP for phone number: {PhoneNumber}", request.PhoneNumber);
            return StatusCode(500, new { Message = "An error occurred while sending OTP" });
        }
    }

    /// <summary>
    /// Verify OTP for phone number
    /// </summary>
    /// <param name="request">Phone number and OTP code</param>
    /// <returns>Verification result</returns>
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerifyOtpResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<VerifyOtpResponse>> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.OtpCode))
            {
                return BadRequest(new { Message = "Phone number and OTP code are required" });
            }

            Log.Information("Verifying OTP for phone number: {PhoneNumber}", request.PhoneNumber);

            var isValid = await _phoneVerificationService.VerifyOtpAsync(request.PhoneNumber, request.OtpCode);

            if (!isValid)
            {
                return BadRequest(new VerifyOtpResponse
                {
                    Success = false,
                    Message = "Invalid OTP code or OTP has expired"
                });
            }

            Log.Information("OTP verified successfully for phone number: {PhoneNumber}", request.PhoneNumber);

            return Ok(new VerifyOtpResponse
            {
                Success = true,
                Message = "Phone number verified successfully"
            });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error verifying OTP for phone number: {PhoneNumber}", request.PhoneNumber);
            return StatusCode(500, new { Message = "An error occurred while verifying OTP" });
        }
    }
}

