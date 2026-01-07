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
  phoneNumber?: string;
  cvUrl?: string;
}

export interface GetAllUsersResponse extends Array<UserInfo> {}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
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

    return this.http.post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        credentials,
        { headers }
    ).pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);

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
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
                'role'
            ) || this.getClaimValue(tokenPayload, 'role_value', 'role_value');

            const user: User = {
              id: parseInt(userId) || 0,
              email: userEmail,
              firstName: '',
              lastName: '',
              role: this.parseRole(userRole || '2'),
              token: response.token
            };

            this.http.get<any>(`${environment.apiUrl}/user/email?email=${encodeURIComponent(user.email)}`).subscribe({
              next: (userInfo: any) => {
                user.firstName = userInfo.firstName || '';
                user.lastName = userInfo.lastName || '';
                user.role = userInfo.role || user.role;
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              },
              error: (error) => {
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
    if (roleString === 'HR' || roleString === '1') return 1;
    if (roleString === 'Admin' || roleString === '0') return 0;
    return 2;
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

  getAllUsers(): Observable<GetAllUsersResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });

    return this.http.get<GetAllUsersResponse>(
        `${environment.apiUrl}/user`,
        { headers }
    ).pipe(
        catchError(this.handleError)
    );
  }

  getCurrentUserProfile(): Observable<UserInfo> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });

    return this.http.get<UserInfo>(
        `${environment.apiUrl}/user/profile`,
        { headers }
    ).pipe(
        catchError(this.handleError)
    );
  }

  uploadCv(cvFile: File): Observable<{ message: string; cvUrl: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('cvFile', cvFile);

    const headers = new HttpHeaders({
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });

    return this.http.post<{ message: string; cvUrl: string }>(
        `${environment.apiUrl}/user/upload-cv`,
        formData,
        { headers }
    ).pipe(
        catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error occurred:', error);

    if (error.error instanceof ErrorEvent) {
      console.error('Client-side error:', error.error.message);
      return throwError(() => ({
        error: { message: `Network error: ${error.error.message}` },
        status: 0,
        fullError: error
      }));
    } else if (error.status === 0) {
      console.error('CORS or Network Error - Check if backend is running and CORS is configured');
      return throwError(() => ({
        error: { message: 'Cannot connect to server. Please check if the backend is running at http://localhost:5265' },
        status: 0,
        fullError: error
      }));
    } else {
      console.error(`Backend returned code ${error.status}, body:`, error.error);

      return throwError(() => ({
        error: error.error || { message: error.message || `Server error: ${error.status}` },
        status: error.status,
        fullError: error
      }));
    }
  }
}