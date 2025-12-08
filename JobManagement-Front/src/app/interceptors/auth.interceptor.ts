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
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        return next(clonedRequest);
    }

    // No token found - send request without Authorization header
    return next(req);
};