import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred';
            if (error.error instanceof ErrorEvent) {
                errorMessage = `Error: ${error.error.message}`;
            } else {
                switch (error.status) {
                    case 400:
                        errorMessage = error.error?.message || error.error?.error || 'Bad request';
                        break;
                    case 401:
                        errorMessage = 'Unauthorized. Please login again.';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to perform this action';
                        break;
                    case 404:
                        errorMessage = error.error?.message || 'Resource not found';
                        break;
                    case 500:
                        errorMessage = error.error?.message || 'Internal server error';
                        break;
                    default:
                        errorMessage = error.error?.message || `Server error: ${error.status}`;
                }
            }
            // Log to console for debugging
            console.error('HTTP Error:', {
                status: error.status,
                message: errorMessage,
                error: error.error
            });
            return throwError(() => ({
                message: errorMessage,
                status: error.status,
                originalError: error
            }));
        })
    );
};