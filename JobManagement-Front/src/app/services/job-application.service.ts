import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Application {
  id: number;
  jobId: number;
  applicantId: number;
  resume: string; 
  coverLetter?: string;
  status: number; // 0 = Pending, 1 = UnderReview, 2 = Approved, 3 = Rejected, 4 = Withdrawn
  appliedAt: string;
  reviewedByUserId?: number;
  reviewedAt?: string;
  job?: any;
  applicant?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    cvUrl?: string;
  };
}

export interface CreateApplicationRequest {
  jobId: number;
  applicantId: number;
  resume?: string;
  coverLetter?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {
  constructor(private http: HttpClient) {
  }

  getApplicationsByJobId(jobId: number): Observable<Application[]> {

    return this.http.get<Application[]>(`${environment.apiUrl}/jobapplication/job/${jobId}`);

  }


  getApplicationsByApplicantId(applicantId: number): Observable<Application[]> {

    return this.http.get<Application[]>(`${environment.apiUrl}/jobapplication/applicant/${applicantId}`);

  }


  getPendingApplications(): Observable<Application[]> {

    return this.http.get<Application[]>(`${environment.apiUrl}/jobapplication/pending`);

  }


  createApplication(application: CreateApplicationRequest): Observable<any> {

    return this.http.post(`${environment.apiUrl}/jobapplication/submit`, application);

  }

  createApplicationWithFile(jobId: number, resumeFile: File | null, coverLetter?: string): Observable<any> {
    // Send JSON instead of FormData (file upload removed)
    const requestBody: CreateApplicationRequest = {
      jobId: jobId,
      applicantId: 0, // Will be set by backend from JWT token
      coverLetter: coverLetter || ''
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(`${environment.apiUrl}/jobapplication/submit`, requestBody, {
      headers: headers
    });

  }


  updateApplicationStatus(id: number, status: number): Observable<any> {

    return this.http.put(`${environment.apiUrl}/jobapplication/${id}/status`, {status});

  }


  deleteApplication(id: number): Observable<any> {

    return this.http.delete(`${environment.apiUrl}/jobapplication/${id}`);

  }
}
