namespace JobManagement.Application.Interfaces;

public interface IPhoneVerificationService
{
    Task<string> GenerateAndSendOtpAsync(string phoneNumber);
    Task<bool> VerifyOtpAsync(string phoneNumber, string otpCode);
}

