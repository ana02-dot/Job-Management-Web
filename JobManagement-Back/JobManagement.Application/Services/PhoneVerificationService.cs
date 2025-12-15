using System.Security.Cryptography;
using JobManagement.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Serilog;

namespace JobManagement.Application.Services;

public class PhoneVerificationService : IPhoneVerificationService
{
    private readonly IMemoryCache _cache;
    private readonly ISmsService _smsService;
    private const int OtpExpirationMinutes = 10;
    private const int OtpLength = 6;

    public PhoneVerificationService(IMemoryCache cache, ISmsService smsService)
    {
        _cache = cache;
        _smsService = smsService;
    }

    public async Task<string> GenerateAndSendOtpAsync(string phoneNumber)
    {
        // Generate a random 6-digit OTP
        var otp = GenerateOtp();
        
        // Store OTP in cache with phone number as key
        var cacheKey = $"otp_{phoneNumber}";
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(OtpExpirationMinutes)
        };
        
        _cache.Set(cacheKey, otp, cacheOptions);
        
        Log.Information("OTP generated for phone number: {PhoneNumber}", phoneNumber);
        
        // Send OTP via SMS
        var message = $"Your verification code is: {otp}";
        var smsSent = await _smsService.SendSmsAsync(phoneNumber, message);
        
        if (!smsSent)
        {
            Log.Warning("Failed to send SMS to {PhoneNumber}. OTP: {Otp}", phoneNumber, otp);
        }
        else
        {
            Log.Information("SMS sent successfully to {PhoneNumber}", phoneNumber);
        }
        
        // In development, return OTP for testing (remove in production)
        // In production, don't return the OTP - only send via SMS
        return otp;
    }

    public Task<bool> VerifyOtpAsync(string phoneNumber, string otpCode)
    {
        var cacheKey = $"otp_{phoneNumber}";
        
        if (!_cache.TryGetValue(cacheKey, out string? storedOtp))
        {
            Log.Warning("OTP verification failed: No OTP found for phone number {PhoneNumber}", phoneNumber);
            return Task.FromResult(false);
        }

        if (storedOtp != otpCode)
        {
            Log.Warning("OTP verification failed: Invalid OTP for phone number {PhoneNumber}", phoneNumber);
            return Task.FromResult(false);
        }

        // Remove OTP from cache after successful verification
        _cache.Remove(cacheKey);
        Log.Information("OTP verified successfully for phone number: {PhoneNumber}", phoneNumber);
        
        return Task.FromResult(true);
    }

    private string GenerateOtp()
    {
        // Generate a random 6-digit OTP
        var randomNumber = RandomNumberGenerator.GetInt32(100000, 999999);
        return randomNumber.ToString("D6");
    }
}

