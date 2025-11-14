import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Application {
  id: number;
  jobId: number;
  applicantId: number;
  resume: string;
  status: number; // 0 = Pending, 1 = UnderReview, 2 = Approved, 3 = Rejected, 4 = Withdrawn
  appliedAt: string;
  reviewedByUserId?: number;
  reviewedAt?: string;
  job?: any;
  applicant?: any;
}

export interface CreateApplicationRequest {
  jobId: number;
  applicantId: number;
  resume?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getApplicationsByJobId(jobId: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${environment.apiUrl}/jobapplication/job/${jobId}`, { headers: this.getHeaders() });
  }

  getApplicationsByApplicantId(applicantId: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${environment.apiUrl}/jobapplication/applicant/${applicantId}`, { headers: this.getHeaders() });
  }

  getPendingApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${environment.apiUrl}/jobapplication/pending`, { headers: this.getHeaders() });
  }

  createApplication(application: CreateApplicationRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/jobapplication/submit`, application);
  }

  updateApplicationStatus(id: number, status: number): Observable<any> {
    return this.http.put(`${environment.apiUrl}/jobapplication/${id}/status`, { status }, { headers: this.getHeaders() });
  }

  deleteApplication(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/jobapplication/${id}`, { headers: this.getHeaders() });
  }
}
