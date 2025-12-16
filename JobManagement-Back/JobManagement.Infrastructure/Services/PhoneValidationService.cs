using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using JobManagement.Application.Interfaces;
using JobManagement.Application.Services;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace JobManagement.Infrastructure.Services;

public class PhoneValidationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly string _apiKey;
    private readonly string _apiBaseUrl;

    public PhoneValidationService(
        HttpClient httpClient, 
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _apiKey = _configuration["PhoneValidation:key"] ?? throw new InvalidOperationException("Phone validation API key not configured");
        _apiBaseUrl = _configuration["PhoneValidation:BaseUrl"];
    }

    public async Task<PhoneValidationResult> ValidatePhoneAsync(string phoneNumber)
    { // Make API request
            var url = $"{_apiBaseUrl}?access_key={_apiKey}&number={phoneNumber}&country_code=GE&format=1";
            
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                Log.Error("Phone validation API returned status code: {StatusCode}", response.StatusCode);
                return new PhoneValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Phone validation service temporarily unavailable"
                };
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var validationResult = JsonSerializer.Deserialize<PhoneValidationApiResponse>(
                jsonResponse, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );


            if (validationResult == null)
            {
                return new PhoneValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Invalid response from phone validation service"
                };
            }

            return new PhoneValidationResult
            {
                IsValid = validationResult.Valid ?? false,
                CountryName = validationResult.CountryName,
                Carrier = validationResult.Carrier,
                ErrorMessage = validationResult.Valid == false ? "Invalid phone number from request" : null
            };
        }
}
public class PhoneValidationApiResponse
{
    public bool? Valid { get; set; }
    public string? Number { get; set; }
    public string? InternationalFormat { get; set; }
    public string? CountryPrefix { get; set; }
    public string? CountryCode { get; set; }
    public string? CountryName { get; set; }
    public string? Carrier { get; set; }
    public string? LineType { get; set; }
}
