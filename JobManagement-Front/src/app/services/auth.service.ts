import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  email: string;
  token: string;
  message: string;
}

export interface UserRegistrationRequest {
  personalNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: number; // 0 = Admin, 1 = HR, 2 = Applicant
}

export interface UserRegistrationResponse {
  userId: number;
  message: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
  token?: string;
}

export interface UserInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
  personalNumber?: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next({ ...user, token });
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Login request URL:', `${environment.apiUrl}/user/login`);
    console.log('Login credentials:', { email: credentials.email });

    return this.http.post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        credentials,
        { headers }
    ).pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response.token) {
            localStorage.setItem('token', response.token);

            // Decode JWT token to extract user info
            const tokenPayload = this.decodeToken(response.token);
            console.log('Token payload:', tokenPayload);

            const userId = this.getClaimValue(
                tokenPayload,
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
                'nameid'
            );
            const userEmail = this.getClaimValue(
                tokenPayload,
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
                'email'
            ) || response.email;
            const userRole = this.getClaimValue(
                tokenPayload,
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
                'role'
            );

            const user: User = {
              id: parseInt(userId) || 0,
              email: userEmail,
              firstName: '', // Will be fetched separately
              lastName: '', // Will be fetched separately
              role: this.parseRole(userRole || '2'),
              token: response.token
            };

            // Fetch full user info
            this.http.get<any>(`${environment.apiUrl}/user/email?email=${encodeURIComponent(user.email)}`).subscribe({
              next: (userInfo: any) => {
                user.firstName = userInfo.firstName || '';
                user.lastName = userInfo.lastName || '';
                user.role = userInfo.role || user.role;
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              },
              error: (error) => {
                console.error('Error fetching user info:', error);
                // If fetch fails, still save what we have
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              }
            });
          }
        }),
        catchError(this.handleError)
    );
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return {};
    }
  }

  private parseRole(roleString: string): number {
    // Role enum: 0 = Admin, 1 = HR, 2 = Applicant
    // Backend sends enum as string: "Admin", "HR", or "Applicant"
    if (roleString === 'HR' || roleString === '1') return 1;
    if (roleString === 'Admin' || roleString === '0') return 0;
    return 2; // Default to Applicant
  }

  private getClaimValue(payload: any, claimName: string, shortName?: string): string {
    if (payload[claimName]) return payload[claimName];
    if (shortName && payload[shortName]) return payload[shortName];
    const variations = [
      claimName.split('/').pop() || '',
      claimName.split('.').pop() || ''
    ];
    for (const variation of variations) {
      if (payload[variation]) return payload[variation];
    }
    return '';
  }

  register(userData: UserRegistrationRequest): Observable<UserRegistrationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Register request URL:', `${environment.apiUrl}/user/register`);
    console.log('Registration data:', userData);

    return this.http.post<UserRegistrationResponse>(
        `${environment.apiUrl}/user/register`,
        userData,
        { headers }
    ).pipe(
        tap(response => console.log('Registration response:', response)),
        catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error occurred:', error);

    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      console.error('Client-side error:', error.error.message);
      errorMessage = `Network error: ${error.error.message}`;
    } else if (error.status === 0) {
      // Status 0 usually means CORS issue or network failure
      console.error('CORS or Network Error - Check if backend is running and CORS is configured');
      errorMessage = 'Cannot connect to server. Please check if the backend is running at http://localhost:5265';
    } else {
      // Backend returned an unsuccessful response code
      console.error(`Backend returned code ${error.status}, body:`, error.error);
      errorMessage = error.error?.message || error.message || `Server error: ${error.status}`;
    }

    return throwError(() => ({
      error: { message: errorMessage },
      status: error.status,
      fullError: error
    }));
  }
}