import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CreateJobRequest {
    title: string;
    description: string;
    requirements: string;
    location: string;
    applicationDeadline: string;  // ISO string format
    salary?: number;
}

export interface Job {
    id: number;
    title: string;
    description: string;
    requirements: string;
    salary?: number;
    location: string;
    status: number;
    applicationDeadline: string;
    createdAt: string;
    createdBy: number;
}

@Injectable({
    providedIn: 'root'
})
export class JobService {
    private apiUrl = `${environment.apiUrl}/Jobs`;

    constructor(private http: HttpClient) {}

    createJob(jobData: CreateJobRequest): Observable<number> {
        const requestData = {
            ...jobData,
            applicationDeadline: new Date(jobData.applicationDeadline).toISOString()
        };

        console.log('Creating job:', requestData);
        return this.http.post<number>(this.apiUrl, requestData);
    }

    getAllJobs(): Observable<Job[]> {
        return this.http.get<Job[]>(this.apiUrl);
    }

    getJobById(id: number): Observable<Job> {
        return this.http.get<Job>(`${this.apiUrl}/${id}`);
    }

    getJobsByStatus(status: number): Observable<Job[]> {
        return this.http.get<Job[]>(`${this.apiUrl}/status/${status}`);
    }
}