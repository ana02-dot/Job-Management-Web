import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Enhanced Auth Interceptor with Debugging
 * Automatically adds JWT token to all HTTP requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Get token from localStorage (secure - don't log token value)
    const token = localStorage.getItem('token');

    // If token exists, clone the request and add Authorization header
    if (token) {
        // For FormData requests, don't set Content-Type - let browser set it with boundary
        const headers: { [key: string]: string } = {
            Authorization: `Bearer ${token}`
        };
        
        // Only set headers, don't touch Content-Type for FormData
        const clonedRequest = req.clone({
            setHeaders: headers
        });

        return next(clonedRequest);
    }

    // No token found - send request without Authorization header
    return next(req);
};