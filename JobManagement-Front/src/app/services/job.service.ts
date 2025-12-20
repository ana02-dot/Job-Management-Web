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
  createdBy?: number; // ID of the user who created the job
}

export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary?: string; // Changed to string to match backend
  workType?: string; // remote, onsite, hybrid
  category?: string;
  applicationDeadline: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  constructor(private http: HttpClient) {
  }

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${environment.apiUrl}/jobs`);
  }


  getJobsByStatus(status: number): Observable<Job[]> {

    return this.http.get<Job[]>(`${environment.apiUrl}/jobs/status/${status}`);

  }


  getJobById(id: number): Observable<Job> {

    return this.http.get<Job>(`${environment.apiUrl}/jobs/${id}`);

  }


  createJob(job: CreateJobRequest): Observable<any> {

    return this.http.post(`${environment.apiUrl}/jobs`, job);

  }


  updateJob(id: number, job: CreateJobRequest): Observable<any> {

    return this.http.put(`${environment.apiUrl}/jobs/${id}`, job);

  }


  deleteJob(id: number): Observable<any> {

    return this.http.delete(`${environment.apiUrl}/jobs/${id}`);

  }
}
