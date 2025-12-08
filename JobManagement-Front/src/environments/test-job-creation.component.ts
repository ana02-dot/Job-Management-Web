import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';

interface CreateJobRequest {
    title: string;
    description: string;
    requirements: string;
    location: string;
    applicationDeadline: string;
    salary?: number;
}

@Component({
    selector: 'app-test-job-creation',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div style="padding: 20px;">
      <h2>Job Creation Debugger</h2>
      
      <div style="background: #f0f0f0; padding: 15px; margin-bottom: 20px;">
        <h3>Token Info</h3>
        <div *ngIf="tokenInfo">
          <p><strong>Has Token:</strong> {{ tokenInfo.hasToken }}</p>
          <p *ngIf="tokenInfo.userId"><strong>User ID:</strong> {{ tokenInfo.userId }}</p>
          <p *ngIf="tokenInfo.email"><strong>Email:</strong> {{ tokenInfo.email }}</p>
          <p *ngIf="tokenInfo.role"><strong>Role:</strong> {{ tokenInfo.role }}</p>
          <p *ngIf="tokenInfo.expiresAt"><strong>Expires:</strong> {{ tokenInfo.expiresAt }}</p>
          <p *ngIf="tokenInfo.isExpired !== undefined">
            <strong>Is Expired:</strong> 
            <span [style.color]="tokenInfo.isExpired ? 'red' : 'green'">
              {{ tokenInfo.isExpired }}
            </span>
          </p>
        </div>
      </div>

      <button (click)="checkToken()" 
              style="padding: 10px 20px; margin-right: 10px; cursor: pointer;">
        Check Token
      </button>

      <button (click)="testJobCreation()" 
              style="padding: 10px 20px; cursor: pointer;"
              [disabled]="!tokenInfo?.hasToken">
        Test Create Job
      </button>

      <div *ngIf="lastRequest" 
           style="background: #e3f2fd; padding: 15px; margin-top: 20px;">
        <h3>Last Request</h3>
        <pre>{{ lastRequest }}</pre>
      </div>

      <div *ngIf="lastResponse" 
           style="background: #c8e6c9; padding: 15px; margin-top: 20px;">
        <h3>Success Response</h3>
        <pre>{{ lastResponse }}</pre>
      </div>

      <div *ngIf="lastError" 
           style="background: #ffcdd2; padding: 15px; margin-top: 20px;">
        <h3>Error Response</h3>
        <pre>{{ lastError }}</pre>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fff3cd;">
        <h3>Debug Console Output</h3>
        <p>Check browser console (F12) for detailed logs</p>
      </div>
    </div>
  `
})
export class TestJobCreationComponent {
    tokenInfo: any = null;
    lastRequest: string = '';
    lastResponse: string = '';
    lastError: string = '';

    constructor(private http: HttpClient) {
        this.checkToken();
    }

    checkToken() {
        console.group('🔐 TOKEN CHECK');

        const token = localStorage.getItem('token');

        if (!token) {
            console.error('❌ No token found in localStorage');
            this.tokenInfo = { hasToken: false };
            console.groupEnd();
            return;
        }

        try {
            // Decode JWT
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('❌ Invalid token format');
                this.tokenInfo = { hasToken: false, error: 'Invalid format' };
                console.groupEnd();
                return;
            }

            const payload = JSON.parse(atob(parts[1]));
            console.log('Token payload:', payload);

            // Extract claims with full namespace
            const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
            const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

            const expiresAt = new Date(payload.exp * 1000);
            const isExpired = expiresAt < new Date();

            this.tokenInfo = {
                hasToken: true,
                userId: userId || 'NOT FOUND',
                email: email || 'NOT FOUND',
                role: role || 'NOT FOUND',
                expiresAt: expiresAt.toLocaleString(),
                isExpired: isExpired
            };

            console.log('✅ Token parsed successfully');
            console.log('User ID:', userId);
            console.log('Email:', email);
            console.log('Role:', role);
            console.log('Expires:', expiresAt);
            console.log('Is Expired:', isExpired);

            if (!userId) {
                console.warn('⚠️ Token missing User ID claim');
            }
            if (!role) {
                console.warn('⚠️ Token missing Role claim');
            } else if (role !== 'HR' && role !== 'Admin') {
                console.warn('⚠️ Role is not HR or Admin:', role);
            }
            if (isExpired) {
                console.error('❌ Token is EXPIRED');
            }

        } catch (error) {
            console.error('❌ Error parsing token:', error);
            this.tokenInfo = { hasToken: true, error: 'Parse error' };
        }

        console.groupEnd();
    }

    testJobCreation() {
        console.group('📝 TEST JOB CREATION');

        // Create test job data
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // 6 months from now

        const jobData: CreateJobRequest = {
            title: 'Test Job - ' + new Date().toISOString(),
            description: 'This is a test job created from Angular debugging component. It includes all required fields.',
            requirements: 'Test requirements: Bachelor degree, 3+ years experience',
            location: 'Tbilisi, Georgia',
            applicationDeadline: futureDate.toISOString(),
            salary: 50000
        };

        console.log('Job data to send:', jobData);
        console.log('API URL:', `${environment.apiUrl}/Jobs`);
        console.log('Application deadline:', jobData.applicationDeadline);
        console.log('Is future date:', new Date(jobData.applicationDeadline) > new Date());

        // Store request for display
        this.lastRequest = JSON.stringify(jobData, null, 2);
        this.lastResponse = '';
        this.lastError = '';

        // Get token
        const token = localStorage.getItem('token');
        console.log('Token (first 50 chars):', token?.substring(0, 50) + '...');

        // Make request
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });

        console.log('Request headers:', headers.keys());

        this.http.post(`${environment.apiUrl}/Jobs`, jobData, {
            headers,
            observe: 'response'  // Get full response
        }).subscribe({
            next: (response) => {
                console.log('✅ SUCCESS - Status:', response.status);
                console.log('Response body:', response.body);
                console.log('Response headers:', response.headers.keys());

                this.lastResponse = JSON.stringify({
                    status: response.status,
                    body: response.body,
                    headers: {
                        'Content-Type': response.headers.get('Content-Type'),
                        'Location': response.headers.get('Location')
                    }
                }, null, 2);

                alert('✅ Job created successfully! Check console for details.');
                console.groupEnd();
            },
            error: (error) => {
                console.error('❌ ERROR - Status:', error.status);
                console.error('Error details:', error);
                console.error('Error body:', error.error);

                // Detailed error analysis
                if (error.status === 400) {
                    console.error('BAD REQUEST - Validation failed');
                    console.error('Validation errors:', error.error);

                    if (error.error.errors) {
                        console.error('Field errors:', error.error.errors);
                    }
                } else if (error.status === 401) {
                    console.error('UNAUTHORIZED - Token is missing or invalid');
                    console.error('Check:');
                    console.error('1. Token exists in localStorage');
                    console.error('2. Token is not expired');
                    console.error('3. Authorization header is present');
                } else if (error.status === 403) {
                    console.error('FORBIDDEN - User does not have permission');
                    console.error('Check:');
                    console.error('1. User role is HR or Admin');
                    console.error('2. Role claim in token is correct');
                } else if (error.status === 500) {
                    console.error('SERVER ERROR - Backend exception');
                    console.error('Check backend logs for details');
                }

                this.lastError = JSON.stringify({
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    error: error.error
                }, null, 2);

                alert(`❌ Error ${error.status}: ${error.message}\nCheck console for details.`);
                console.groupEnd();
            }
        });

        console.groupEnd();
    }
}