import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    
    return next(req).pipe(
        catchError((error: unknown) => {
            // Ensure we have an HttpErrorResponse
            if (!(error instanceof HttpErrorResponse)) {
                console.error('Non-HTTP error caught:', error);
                return throwError(() => ({
                    message: 'An unexpected error occurred',
                    status: 0,
                    originalError: error
                }));
            }

            const httpError = error as HttpErrorResponse;
            let errorMessage = 'An unexpected error occurred';
            
            try {
                if (httpError.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = `Error: ${httpError.error.message}`;
                } else {
                    // Server-side error
                    const errorStatus = httpError.status ?? 0;
                    
                    let serverMessage: string | undefined;
                    if (httpError.error) {
                        if (typeof httpError.error === 'string') {
                            serverMessage = httpError.error;
                        } else if (typeof httpError.error === 'object' && httpError.error !== null) {
                            serverMessage = (httpError.error as any)?.message || (httpError.error as any)?.error;
                        }
                    }
                    
                    switch (errorStatus) {
                        case 400:
                            errorMessage = serverMessage || 'Bad request';
                            break;
                        case 401:
                            errorMessage = 'Unauthorized. Please login again.';
                            break;
                        case 403:
                            errorMessage = serverMessage || 'You do not have permission to perform this action';
                            break;
                        case 404:
                            errorMessage = serverMessage || 'Resource not found';
                            break;
                        case 500:
                            errorMessage = serverMessage || 'Internal server error';
                            break;
                        default:
                            if (errorStatus === 0) {
                                errorMessage = 'Cannot connect to server. Please check if the backend is running.';
                            } else {
                                errorMessage = serverMessage || `Server error: ${errorStatus}`;
                            }
                    }
                }
            } catch (processingError) {
                // If error processing fails, use a safe fallback
                console.error('Error processing HTTP error:', processingError);
                errorMessage = 'An error occurred while processing the request';
            }
            
            // Log error details for debugging
            console.error('HTTP Error:', {
                status: httpError.status ?? 0,
                message: errorMessage,
                url: httpError.url,
                error: httpError.error
            });
            
            // Return a properly formatted error object
            return throwError(() => ({
                message: errorMessage,
                status: httpError.status ?? 0,
                originalError: httpError,
                error: httpError.error
            }));
        })
    );
};