import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary?: number;
  status: number; // 0 = Active, 1 = Closed, 2 = Cancelled
  applicationDeadline: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary?: number;
  applicationDeadline: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${environment.apiUrl}/jobs`, { headers: this.getHeaders() });
  }

  getJobsByStatus(status: number): Observable<Job[]> {
    return this.http.get<Job[]>(`${environment.apiUrl}/jobs/status/${status}`);
  }

  getJobById(id: number): Observable<Job> {
    return this.http.get<Job>(`${environment.apiUrl}/jobs/${id}`, { headers: this.getHeaders() });
  }

  createJob(job: CreateJobRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/jobs`, job, { headers: this.getHeaders() });
  }

  updateJob(id: number, job: CreateJobRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/jobs/${id}`, job, { headers: this.getHeaders() });
  }

  deleteJob(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/jobs/${id}`, { headers: this.getHeaders() });
  }
}
