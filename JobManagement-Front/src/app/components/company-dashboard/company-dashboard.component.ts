import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService, Job, CreateJobRequest } from '../../services/job.service';
import { JobApplicationService, Application } from '../../services/job-application.service';
import { LucideAngularModule, Briefcase, MapPin, Calendar, DollarSign, Users, Eye, XCircle, CheckCircle, Clock, LogOut, AlertCircle } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <lucide-briefcase class="w-6 h-6 text-white" />
              </div>
              <h1 class="text-xl font-bold text-slate-900">Jobs.ge - HR Dashboard</h1>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-slate-600 font-medium">{{ companyName }}</span>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <lucide-log-out class="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="container mx-auto px-4 py-8 max-w-7xl">
        <!-- Stats Section -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Total Jobs</p>
                <p class="text-3xl font-bold text-slate-900">{{ myJobs.length }}</p>
              </div>
              <lucide-briefcase class="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Active Jobs</p>
                <p class="text-3xl font-bold text-green-600">{{ getActiveJobsCount() }}</p>
              </div>
              <lucide-check-circle class="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Applications</p>
                <p class="text-3xl font-bold text-purple-600">{{ totalApplications }}</p>
              </div>
              <lucide-users class="w-10 h-10 text-purple-600" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Pending Review</p>
                <p class="text-3xl font-bold text-yellow-600">{{ pendingApplications }}</p>
              </div>
              <lucide-clock class="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <lucide-alert-circle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <h3 class="font-semibold text-red-900 mb-1">Error</h3>
            <p class="text-sm text-red-700 whitespace-pre-wrap">{{ errorMessage }}</p>
          </div>
          <button (click)="errorMessage = ''" class="text-red-400 hover:text-red-600">
            <lucide-x-circle class="w-5 h-5" />
          </button>
        </div>

        <!-- Success Message -->
        <div *ngIf="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <lucide-check-circle class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-green-700">{{ successMessage }}</p>
          </div>
          <button (click)="successMessage = ''" class="text-green-400 hover:text-green-600">
            <lucide-x-circle class="w-5 h-5" />
          </button>
        </div>

        <!-- Create Job Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-900">Post New Job</h2>
          <div class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Job Title *</label>
                <input
                  type="text"
                  [(ngModel)]="newJob.title"
                  name="title"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Software Engineer"
                  required>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Location *</label>
                <input
                  type="text"
                  [(ngModel)]="newJob.location"
                  name="location"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Tbilisi, Georgia"
                  required>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 text-slate-700">Job Description *</label>
              <textarea
                [(ngModel)]="newJob.description"
                name="description"
                rows="4"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the role and responsibilities..."
                required></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 text-slate-700">Requirements *</label>
              <textarea
                [(ngModel)]="newJob.requirements"
                name="requirements"
                rows="3"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List the required qualifications and skills..."
                required></textarea>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Salary (GEL)</label>
                <input
                  type="number"
                  [(ngModel)]="newJob.salary"
                  name="salary"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 5000">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Application Deadline</label>
                <input
                  type="date"
                  [(ngModel)]="newJob.applicationDeadline"
                  name="deadline"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [min]="minDate">
              </div>
            </div>

            <button
              (click)="createJob()"
              type="button"
              [disabled]="isCreating"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium">
              <span *ngIf="!isCreating">Post Job</span>
              <span *ngIf="isCreating">Posting...</span>
            </button>
          </div>
        </div>

        <!-- My Jobs Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-4 text-slate-900">My Posted Jobs</h2>

          <div *ngIf="isLoadingJobs" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-slate-600 mt-2">Loading jobs...</p>
          </div>

          <div *ngIf="!isLoadingJobs && myJobs.length === 0" class="text-center py-8 text-slate-600">
            No jobs posted yet. Create your first job above!
          </div>

          <div *ngIf="!isLoadingJobs" class="space-y-4">
            <div *ngFor="let job of myJobs"
                 class="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ job.title }}</h3>
                  <div class="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div class="flex items-center gap-1">
                      <lucide-map-pin class="w-4 h-4" />
                      <span>{{ job.location }}</span>
                    </div>
                    <div class="flex items-center gap-1" *ngIf="job.salary">
                      <lucide-dollar-sign class="w-4 h-4" />
                      <span>₾{{ job.salary }}</span>
                    </div>
                    <div class="flex items-center gap-1" *ngIf="job.applicationDeadline">
                      <lucide-calendar class="w-4 h-4" />
                      <span>Deadline: {{ job.applicationDeadline | date }}</span>
                    </div>
                  </div>
                </div>
                <span [class]="getStatusBadgeClass(job.status)" class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ getStatusText(job.status) }}
                </span>
              </div>

              <p class="text-slate-600 mb-4 line-clamp-2">{{ job.description }}</p>

              <div class="flex gap-2">
                <button
                  (click)="viewApplications(job.id!)"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <lucide-eye class="w-4 h-4" />
                  View Applications
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Applications Modal -->
        <div *ngIf="showApplications"
             class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 class="text-xl font-bold text-slate-900">Applications</h3>
              <button
                (click)="showApplications = false"
                class="text-slate-400 hover:text-slate-600">
                <lucide-x-circle class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6">
              <div *ngIf="applications.length === 0" class="text-center py-8 text-slate-600">
                No applications received yet.
              </div>
              <div *ngFor="let app of applications" class="border-b border-slate-200 pb-4 mb-4 last:border-0">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="font-semibold text-slate-900">Application #{{ app.id }}</div>
                    <div class="text-sm text-slate-600">Applied: {{ app.appliedAt | date:'medium' }}</div>
                    <div class="text-sm text-slate-600 mt-1">Applicant ID: {{ app.applicantId }}</div>
                  </div>
                  <span [class]="getApplicationStatusClass(app.status)" class="px-3 py-1 rounded-full text-sm font-medium">
                    {{ getApplicationStatusText(app.status) }}
                  </span>
                </div>
                <div *ngIf="app.resume" class="mt-2 text-sm text-slate-600">
                  <strong>Resume:</strong> {{ app.resume }}
                </div>
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
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
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
  totalApplications = 0;
  pendingApplications = 0;
  errorMessage = '';
  successMessage = '';
  minDate = new Date().toISOString().split('T')[0];

  newJob: CreateJobRequest = {
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary: undefined,
    applicationDeadline: ''
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

    this.companyName = `${user.firstName} ${user.lastName}` || user.email;
    this.loadMyJobs();
  }

  loadMyJobs() {
    this.isLoadingJobs = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs: Job[]) => {
        this.myJobs = jobs;
        this.isLoadingJobs = false;
        console.log('Loaded jobs:', jobs);
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.errorMessage = 'Failed to load jobs: ' + (error.error?.message || error.message);
        this.isLoadingJobs = false;
      }
    });
  }

  createJob() {
    // Validate required fields
    if (!this.newJob.title || !this.newJob.description || !this.newJob.requirements || !this.newJob.location) {
      this.errorMessage = 'Please fill in all required fields (Title, Description, Requirements, Location)';
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Prepare job data
    const jobData: CreateJobRequest = {
      title: this.newJob.title.trim(),
      description: this.newJob.description.trim(),
      requirements: this.newJob.requirements.trim(),
      location: this.newJob.location.trim(),
      salary: this.newJob.salary || undefined,
      applicationDeadline: this.newJob.applicationDeadline
    };

    console.log('Creating job with data:', jobData);

    this.jobService.createJob(jobData).subscribe({
      next: (response) => {
        console.log('Job created successfully:', response);
        this.successMessage = 'Job posted successfully!';

        // Reset form
        this.newJob = {
          title: '',
          description: '',
          requirements: '',
          location: '',
          salary: undefined,
          applicationDeadline: '',
        };

        this.loadMyJobs();
        this.isCreating = false;

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error: any) => {
        console.error('Error creating job:', error);

        let message = 'Failed to post job. ';

        if (error.error?.message) {
          message += error.error.message;
        } else if (error.message) {
          message += error.message;
        }

        if (error.error?.details) {
          message += '\n\nDetails: ' + error.error.details;
        }

        // Add helpful messages based on status
        if (error.status === 401) {
          message += '\n\nYour session may have expired. Please logout and login again.';
        } else if (error.status === 403) {
          message += '\n\nYou do not have permission to create jobs. Make sure you are logged in as HR.';
        } else if (error.status === 0) {
          message += '\n\nCannot connect to server. Please check if the backend is running at http://localhost:5265';
        }

        this.errorMessage = message;
        this.isCreating = false;
      }
    });
  }

  viewApplications(jobId: number) {
    this.selectedJobId = jobId;
    this.showApplications = true;
    this.jobApplicationService.getApplicationsByJobId(jobId).subscribe({
      next: (apps: Application[]) => {
        this.applications = apps;
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
        this.applications = [];
      }
    });
  }

  getActiveJobsCount(): number {
    return this.myJobs.filter(job => job.status === 0).length; // 0 = Active
  }

  getStatusBadgeClass(status: number | undefined): string {
    if (status === 0) return 'bg-green-100 text-green-700'; // Active
    if (status === 1) return 'bg-slate-100 text-slate-700'; // Closed
    if (status === 2) return 'bg-red-100 text-red-700'; // Cancelled
    return 'bg-slate-100 text-slate-700';
  }

  getStatusText(status: number | undefined): string {
    if (status === 0) return 'Active';
    if (status === 1) return 'Closed';
    if (status === 2) return 'Cancelled';
    return 'Unknown';
  }

  getApplicationStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Under Review',
      2: 'Approved',
      3: 'Rejected',
      4: 'Withdrawn'
    };
    return statusMap[status] || 'Unknown';
  }

  getApplicationStatusClass(status: number): string {
    const classMap: { [key: number]: string } = {
      0: 'bg-yellow-100 text-yellow-700',
      1: 'bg-blue-100 text-blue-700',
      2: 'bg-green-100 text-green-700',
      3: 'bg-red-100 text-red-700',
      4: 'bg-slate-100 text-slate-700'
    };
    return classMap[status] || 'bg-slate-100 text-slate-700';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
