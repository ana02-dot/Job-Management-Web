import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { JobApplicationService, Application } from '../../services/job-application.service';
import { LucideAngularModule } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-job-seeker-dashboard',
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
              <h1 class="text-xl font-bold text-slate-900">Jobs.ge - Job Seeker</h1>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-slate-600">
                <lucide-user class="w-4 h-4" />
                <span class="font-medium">{{ userName }}</span>
              </div>
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
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Available Jobs</p>
                <p class="text-3xl font-bold text-blue-600">{{ availableJobs.length }}</p>
              </div>
              <lucide-briefcase class="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">My Applications</p>
                <p class="text-3xl font-bold text-purple-600">{{ myApplications.length }}</p>
              </div>
              <lucide-file-text class="w-10 h-10 text-purple-600" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Pending</p>
                <p class="text-3xl font-bold text-yellow-600">{{ getPendingCount() }}</p>
              </div>
              <lucide-clock class="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-md mb-6">
          <div class="border-b">
            <div class="flex">
              <button
                (click)="activeTab = 'jobs'"
                [class.border-b-2]="activeTab === 'jobs'"
                [class.border-blue-600]="activeTab === 'jobs'"
                [class.text-blue-600]="activeTab === 'jobs'"
                class="px-6 py-3 font-medium transition-colors">
                Available Jobs
              </button>
              <button
                (click)="activeTab = 'applications'"
                [class.border-b-2]="activeTab === 'applications'"
                [class.border-blue-600]="activeTab === 'applications'"
                [class.text-blue-600]="activeTab === 'applications'"
                class="px-6 py-3 font-medium transition-colors">
                My Applications
              </button>
            </div>
          </div>
        </div>

        <!-- Available Jobs Tab -->
        <div *ngIf="activeTab === 'jobs'" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-4 text-slate-900">Browse Jobs</h2>

          <div *ngIf="isLoadingJobs" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-slate-600 mt-2">Loading jobs...</p>
          </div>

          <div *ngIf="!isLoadingJobs && availableJobs.length === 0" class="text-center py-8 text-slate-600">
            No active jobs available at the moment.
          </div>

          <div *ngIf="!isLoadingJobs" class="space-y-4">
            <div *ngFor="let job of availableJobs"
                 class="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ job.title }}</h3>

              <div class="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                <div class="flex items-center gap-1">
                  <lucide-map-pin class="w-4 h-4" />
                  <span>{{ job.location }}</span>
                </div>
                <div class="flex items-center gap-1" *ngIf="job.salary">
                  <lucide-dollar-sign class="w-4 h-4" />
                  <span>₾{{ job.salary }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <lucide-calendar class="w-4 h-4" />
                  <span>Deadline: {{ job.applicationDeadline | date }}</span>
                </div>
              </div>

              <p class="text-slate-600 mb-3">{{ job.description }}</p>

              <div *ngIf="job.requirements" class="mb-4">
                <div class="font-medium text-slate-700 mb-1">Requirements:</div>
                <p class="text-sm text-slate-600">{{ job.requirements }}</p>
              </div>

              <button
                (click)="applyToJob(job)"
                [disabled]="hasApplied(job.id) || isApplying"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <lucide-send class="w-4 h-4" />
                <span *ngIf="!hasApplied(job.id)">{{ isApplying ? 'Applying...' : 'Apply Now' }}</span>
                <span *ngIf="hasApplied(job.id)">Already Applied</span>
              </button>
            </div>
          </div>
        </div>

        <!-- My Applications Tab -->
        <div *ngIf="activeTab === 'applications'" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-4 text-slate-900">My Applications</h2>

          <div *ngIf="isLoadingApplications" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-slate-600 mt-2">Loading applications...</p>
          </div>

          <div *ngIf="!isLoadingApplications && myApplications.length === 0" class="text-center py-8 text-slate-600">
            You haven't applied to any jobs yet.
          </div>

          <div *ngIf="!isLoadingApplications" class="space-y-4">
            <div *ngFor="let app of myApplications"
                 class="border border-slate-200 rounded-lg p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Application #{{ app.id }}</h3>
                  <p class="text-sm text-slate-600">Job ID: {{ app.jobId }}</p>
                  <p class="text-sm text-slate-600">Applied: {{ app.appliedAt | date:'medium' }}</p>
                </div>
                <span [class]="getStatusBadgeClass(app.status)" class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ getStatusText(app.status) }}
                </span>
              </div>
              <div *ngIf="app.resume" class="text-sm text-slate-600">
                <strong>Resume:</strong> {{ app.resume }}
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
export class JobSeekerDashboardComponent implements OnInit {
  userName = '';
  availableJobs: Job[] = [];
  myApplications: Application[] = [];
  isLoadingJobs = false;
  isLoadingApplications = false;
  isApplying = false;
  activeTab: 'jobs' | 'applications' = 'jobs';
  currentUserId = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private jobService: JobService,
    private jobApplicationService: JobApplicationService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    this.userName = `${user.firstName} ${user.lastName}` || user.email;
    this.currentUserId = user.id;
    this.loadAvailableJobs();
    this.loadMyApplications();
  }

  loadAvailableJobs() {
    this.isLoadingJobs = true;
    this.jobService.getJobsByStatus(0).subscribe({ // 0 = Active
      next: (jobs: Job[]) => {
        this.availableJobs = jobs;
        this.isLoadingJobs = false;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.isLoadingJobs = false;
      }
    });
  }

  loadMyApplications() {
    this.isLoadingApplications = true;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.jobApplicationService.getApplicationsByApplicantId(user.id).subscribe({
      next: (apps: Application[]) => {
        this.myApplications = apps;
        this.isLoadingApplications = false;
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
        this.isLoadingApplications = false;
      }
    });
  }

  applyToJob(job: Job) {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    this.isApplying = true;
    const application = {
      jobId: job.id,
      applicantId: user.id,
      resume: 'Resume submitted via web application'
    };

    this.jobApplicationService.createApplication(application).subscribe({
      next: () => {
        alert('Application submitted successfully!');
        this.loadMyApplications();
        this.isApplying = false;
      },
      error: (error: any) => {
        console.error('Error submitting application:', error);
        alert(error.error?.message || 'Failed to submit application');
        this.isApplying = false;
      }
    });
  }

  hasApplied(jobId: number): boolean {
    return this.myApplications.some(app => app.jobId === jobId);
  }

  getPendingCount(): number {
    return this.myApplications.filter(app => app.status === 0).length;
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Under Review',
      2: 'Approved',
      3: 'Rejected',
      4: 'Withdrawn'
    };
    return statusMap[status] || 'Unknown';
  }

  getStatusBadgeClass(status: number): string {
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
