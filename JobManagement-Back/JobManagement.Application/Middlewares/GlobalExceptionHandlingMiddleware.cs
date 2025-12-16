using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace JobManagement.Application.Middlewares;

public class GlobalExceptionHandlingMiddleware
{
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    private readonly RequestDelegate _next;

    public GlobalExceptionHandlingMiddleware(ILogger<GlobalExceptionHandlingMiddleware> logger, RequestDelegate next)
    {
        _logger = logger;
        _next = next;
    }
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            _logger.LogInformation("Request started: {Method} {Path}", context.Request.Method, context.Request.Path);
            await _next(context);
            _logger.LogInformation("Request completed successfully: {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        int statusCode;
        string error;

        switch (exception)
        {
            case System.ComponentModel.DataAnnotations.ValidationException:
                statusCode = (int)HttpStatusCode.BadRequest;
                error = "Validation Error";
                break;
            case UnauthorizedAccessException:
                statusCode = (int)HttpStatusCode.Forbidden;
                error = "Access Denied";
                break;
            case KeyNotFoundException:
                statusCode = (int)HttpStatusCode.NotFound;
                error = "Not Found";
                break;
            case InvalidOperationException:
                statusCode = (int)HttpStatusCode.BadRequest;
                error = "Invalid Operation";
                break;
            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                error = "Internal Server Error";
                break;
        }
        context.Response.StatusCode = statusCode;

        var response = new
        {
            status = statusCode,
            error,
            message = exception.Message,
            traceId = context.TraceIdentifier
        };
        var jsonResponse = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(jsonResponse);
    }

}