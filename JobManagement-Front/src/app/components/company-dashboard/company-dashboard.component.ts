import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService, Job, CreateJobRequest } from '../../services/job.service';
import { JobApplicationService, Application } from '../../services/job-application.service';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="bg-white border-b sticky top-0 z-50">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <h1 class="text-xl font-bold text-slate-900">Jobs.ge - Company Dashboard</h1>
            <div class="flex items-center gap-4">
              <span class="text-slate-600">{{ companyName }}</span>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="container mx-auto px-4 py-8 max-w-7xl">
        <!-- Create Job Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-2xl font-bold mb-4">Create New Job</h2>
          <form (ngSubmit)="createJob()" class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  [(ngModel)]="newJob.title"
                  name="title"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  [(ngModel)]="newJob.location"
                  name="location"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <textarea
                [(ngModel)]="newJob.description"
                name="description"
                rows="4"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required></textarea>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Employment Type</label>
                <select
                  [(ngModel)]="newJob.employmentType"
                  name="employmentType"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Salary (optional)</label>
                <input
                  type="text"
                  [(ngModel)]="newJob.salary"
                  name="salary"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="₾4,000 - ₾6,000">
              </div>
            </div>

            <button
              type="submit"
              [disabled]="isCreating"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {{ isCreating ? 'Creating...' : 'Create Job' }}
            </button>
          </form>
        </div>

        <!-- My Jobs Section -->
        <div>
          <h2 class="text-2xl font-bold mb-4">My Jobs</h2>
          <div *ngIf="isLoadingJobs" class="text-center py-8">Loading jobs...</div>
          <div *ngIf="!isLoadingJobs && myJobs.length === 0" class="text-center py-8 text-slate-600">
            You haven't created any jobs yet.
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div *ngFor="let job of myJobs" class="bg-white rounded-lg shadow-md p-6">
              <h3 class="text-xl font-semibold mb-2">{{ job.title }}</h3>
              <p class="text-slate-600 mb-4">{{ job.description }}</p>
              <div class="space-y-2 mb-4">
                <div class="text-sm"><strong>Location:</strong> {{ job.location }}</div>
                <div class="text-sm"><strong>Type:</strong> {{ job.employmentType }}</div>
                <div class="text-sm"><strong>Status:</strong> 
                  <span [class.text-green-600]="job.status === 1" [class.text-gray-600]="job.status === 0">
                    {{ job.status === 1 ? 'Published' : 'Draft' }}
                  </span>
                </div>
              </div>
              <button
                (click)="viewApplications(job.id)"
                class="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                View Applications
              </button>
            </div>
          </div>
        </div>

        <!-- Applications Modal -->
        <div *ngIf="showApplications" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold">Applications for Job #{{ selectedJobId }}</h3>
              <button
                (click)="showApplications = false"
                class="text-2xl text-slate-600 hover:text-slate-900">
                ×
              </button>
            </div>
            <div *ngIf="applications.length === 0" class="text-center py-8 text-slate-600">
              No applications yet.
            </div>
            <div *ngFor="let app of applications" class="border-b pb-4 mb-4">
              <div class="font-semibold">Application #{{ app.id }}</div>
              <div class="text-sm text-slate-600">Applied: {{ app.appliedDate | date }}</div>
              <div class="text-sm">Status: 
                <span [class.text-blue-600]="app.status === 0"
                      [class.text-yellow-600]="app.status === 1"
                      [class.text-green-600]="app.status === 3"
                      [class.text-red-600]="app.status === 4">
                  {{ getStatusText(app.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1280px;
      margin: 0 auto;
    }
  `]
})
export class CompanyDashboardComponent implements OnInit {
  companyName = '';
  myJobs: Job[] = [];
  isLoadingJobs = false;
  isCreating = false;
  showApplications = false;
  selectedJobId = 0;
  applications: Application[] = [];

  newJob: CreateJobRequest = {
    title: '',
    description: '',
    location: '',
    employmentType: 'Full-time',
    salary: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private jobService: JobService,
    private jobApplicationService: JobApplicationService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 1) {
      this.router.navigate(['/auth']);
      return;
    }

    this.companyName = user.firstName || user.email;
    this.loadMyJobs();
  }

  loadMyJobs() {
    this.isLoadingJobs = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        // Filter jobs created by current user
        const user = this.authService.getCurrentUser();
        this.myJobs = jobs.filter(job => job.createdBy === user?.id);
        this.isLoadingJobs = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.isLoadingJobs = false;
      }
    });
  }

  createJob() {
    this.isCreating = true;
    this.jobService.createJob(this.newJob).subscribe({
      next: () => {
        alert('Job created successfully!');
        this.newJob = {
          title: '',
          description: '',
          location: '',
          employmentType: 'Full-time',
          salary: ''
        };
        this.loadMyJobs();
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating job:', error);
        alert(error.error?.message || 'Failed to create job');
        this.isCreating = false;
      }
    });
  }

  viewApplications(jobId: number) {
    this.selectedJobId = jobId;
    this.showApplications = true;
    this.jobApplicationService.getApplicationsByJob(jobId).subscribe({
      next: (apps) => {
        this.applications = apps;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.applications = [];
      }
    });
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Submitted',
      1: 'Reviewing',
      2: 'Interview',
      3: 'Offer',
      4: 'Rejected'
    };
    return statusMap[status] || 'Unknown';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

