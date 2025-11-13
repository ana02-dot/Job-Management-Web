import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            // Decode JWT token to extract user info
            const tokenPayload = this.decodeToken(response.token);
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
              error: () => {
                // If fetch fails, still save what we have
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              }
            });
          }
        })
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
    // Try full URI first (what .NET uses)
    if (payload[claimName]) return payload[claimName];
    // Try short name
    if (shortName && payload[shortName]) return payload[shortName];
    // Try common variations
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
    return this.http.post<UserRegistrationResponse>(`${environment.apiUrl}/user/register`, userData);
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
}

