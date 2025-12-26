import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { JobApplicationService } from '../../services/job-application.service';
import { LucideAngularModule, ArrowLeft, CheckCircle } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-slate-900">
      <!-- Header -->
      <header class="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-8 w-auto" />
              <h1 class="text-xl font-bold text-white">Job Details</h1>
            </div>
            <button
              (click)="goBack()"
              class="px-4 py-2 text-slate-300 hover:text-white transition-colors flex items-center gap-2 border border-slate-700 rounded-lg hover:border-slate-600">
              <lucide-arrow-left class="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <div class="container mx-auto px-4 py-8 max-w-5xl">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-16">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p class="text-slate-400 mt-4">Loading job details...</p>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage && !isLoading" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p class="text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Job Details -->
        <div *ngIf="!isLoading && job" class="space-y-6">
          <!-- Title and Status -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div class="flex items-start justify-between mb-4">
              <h1 class="text-3xl font-bold text-white">{{ job.title }}</h1>
              <span [ngClass]="getStatusBadgeClass()" class="px-4 py-2 rounded-full text-sm font-semibold">
                {{ getStatusText() }}
              </span>
            </div>

            <!-- Job Meta Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="flex items-center gap-3 text-slate-300">
                <img src="/assets/images/location-asset.png" alt="Location" class="w-5 h-5 object-contain text-cyan-400" />
                <span>{{ job.location }}</span>
              </div>
              
              <div class="flex items-center gap-3 text-slate-300" *ngIf="job.workType">
                <img src="/assets/images/worktype.png" alt="Work Type" class="w-5 h-5 object-contain text-purple-400" />
                <span class="capitalize">{{ job.workType }}</span>
              </div>
              
              <div class="flex items-center gap-3 text-slate-300" *ngIf="job.salary">
                <img src="/assets/images/salary.png" alt="Salary" class="w-5 h-5 object-contain text-yellow-400" />
                <span>₾{{ job.salary }}</span>
              </div>
              
              <div class="flex items-center gap-3 text-slate-300" *ngIf="job.applicationDeadline">
                <img src="/assets/images/deadline.png" alt="Deadline" class="w-5 h-5 object-contain text-blue-400" />
                <span>{{ job.applicationDeadline | date:'medium' }}</span>
              </div>
            </div>

            <!-- Application Status -->
            <div *ngIf="isApplicationClosed()" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p class="text-red-400 font-semibold">Application Closed</p>
              <p class="text-red-300 text-sm mt-1">This job is no longer accepting applications.</p>
            </div>

            <!-- Apply Button -->
            <div *ngIf="canApply()" class="mt-6">
              <button
                (click)="navigateToApply()"
                class="w-full md:w-auto px-8 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all duration-300 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2">
                <lucide-check-circle class="w-5 h-5" />
                Apply Now
              </button>
            </div>

            <div *ngIf="hasApplied" class="mt-6">
              <div class="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                <p class="text-green-400 font-semibold flex items-center gap-2">
                  <lucide-check-circle class="w-5 h-5" />
                  You have already applied for this job
                </p>
              </div>
            </div>
          </div>

          <!-- Additional Info Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Location Card -->
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 group hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <div class="flex items-center gap-3 mb-3">
                <img src="/assets/images/location-asset.png" alt="Location" class="w-7 h-7 object-contain text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                <h3 class="text-lg font-semibold text-white">Location</h3>
              </div>
              <p class="text-slate-300">{{ job.location }}</p>
            </div>

            <!-- Work Type Card -->
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 group hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]" *ngIf="job.workType">
              <div class="flex items-center gap-3 mb-3">
                <img src="/assets/images/worktype.png" alt="Work Type" class="w-7 h-7 object-contain text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                <h3 class="text-lg font-semibold text-white">Work Type</h3>
              </div>
              <p class="text-slate-300 capitalize">{{ job.workType }}</p>
            </div>

            <!-- Salary Card -->
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 group hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]" *ngIf="job.salary">
              <div class="flex items-center gap-3 mb-3">
                <img src="/assets/images/salary.png" alt="Salary" class="w-7 h-7 object-contain text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
                <h3 class="text-lg font-semibold text-white">Salary</h3>
              </div>
              <p class="text-slate-300">₾{{ job.salary }}</p>
            </div>

            <!-- Deadline Card -->
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 group transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" [ngClass]="isApplicationClosed() ? 'hover:border-red-500/50' : 'hover:border-blue-500/50'">
              <div class="flex items-center gap-3 mb-3">
                <img src="/assets/images/deadline.png" alt="Deadline" class="w-7 h-7 object-contain transition-colors duration-300" [ngClass]="isApplicationClosed() ? 'text-red-400 group-hover:text-red-300' : 'text-blue-400 group-hover:text-blue-300'" />
                <h3 class="text-lg font-semibold text-white">Application Deadline</h3>
              </div>
              <p class="text-slate-300">{{ job.applicationDeadline | date:'medium' }}</p>
              <p *ngIf="isApplicationClosed()" class="text-red-400 text-sm mt-2">Closed</p>
            </div>
          </div>

          <!-- Description -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Job Description</h2>
            <div class="text-slate-300 whitespace-pre-wrap leading-relaxed">{{ job.description }}</div>
          </div>

          <!-- Requirements -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6" *ngIf="job.requirements">
            <h2 class="text-2xl font-bold text-white mb-4">Requirements</h2>
            <div class="text-slate-300 whitespace-pre-wrap leading-relaxed">{{ job.requirements }}</div>
          </div>
        </div>

        <!-- Job Not Found -->
        <div *ngIf="!isLoading && !job && !errorMessage" class="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center">
          <h2 class="text-2xl font-bold mb-4 text-white">Job Not Found</h2>
          <p class="text-slate-400 mb-6">The job you're looking for doesn't exist or is no longer available.</p>
          <button
            (click)="goBack()"
            class="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors">
            Go Back
          </button>
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
export class JobDetailsComponent implements OnInit {
  job: Job | null = null;
  jobId: number = 0;
  isLoading = false;
  errorMessage = '';
  hasApplied = false;
  myApplications: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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

    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.jobId = +idParam;
        if (this.jobId && this.jobId > 0) {
          this.loadJob();
          if (user.role === 2) { // Applicant role
            this.loadMyApplications(user.id);
          }
        } else {
          this.errorMessage = 'Invalid job ID.';
        }
      } else {
        this.errorMessage = 'No job ID provided.';
      }
    });
  }

  loadJob() {
    this.isLoading = true;
    this.errorMessage = '';
    this.jobService.getJobById(this.jobId).subscribe({
      next: (job: Job) => {
        this.job = job;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading job:', error);
        let message = 'Failed to load job details. ';
        
        if (error.status === 403) {
          message += 'You do not have permission to view this job.';
        } else if (error.status === 404) {
          message += 'Job not found.';
        } else if (error.status === 401) {
          message += 'Please login again.';
        } else if (error.status === 0) {
          message += 'Cannot connect to server.';
        } else if (error.error?.message) {
          message += error.error.message;
        }
        
        this.errorMessage = message;
        this.isLoading = false;
      }
    });
  }

  loadMyApplications(applicantId: number) {
    this.jobApplicationService.getApplicationsByApplicantId(applicantId).subscribe({
      next: (applications: any[]) => {
        this.myApplications = applications;
        this.hasApplied = applications.some(app => app.jobId === this.jobId);
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
      }
    });
  }

  isApplicationClosed(): boolean {
    if (!this.job) return false;
    
    // Check if job status is Closed (1) or Cancelled (2)
    if (this.job.status === 1 || this.job.status === 2) {
      return true;
    }
    
    // Check if deadline has passed (end of day)
    if (this.job.applicationDeadline) {
      const deadline = new Date(this.job.applicationDeadline);
      deadline.setHours(23, 59, 59, 999); // End of day
      return deadline < new Date();
    }
    
    return false;
  }

  canApply(): boolean {
    if (!this.job) return false;
    if (this.hasApplied) return false;
    if (this.isApplicationClosed()) return false;
    // Job status must be Active (0)
    return this.job.status === 0;
  }

  getStatusBadgeClass(): string {
    if (!this.job) return 'bg-slate-700 text-slate-300';
    
    switch (this.job.status) {
      case 0: // Active
        return 'bg-green-900/50 text-green-400 border border-green-500/50';
      case 1: // Closed
        return 'bg-red-900/50 text-red-400 border border-red-500/50';
      case 2: // Cancelled
        return 'bg-slate-700 text-slate-300 border border-slate-600';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  }

  getStatusText(): string {
    if (!this.job) return 'Unknown';
    
    switch (this.job.status) {
      case 0:
        return 'Active';
      case 1:
        return 'Closed';
      case 2:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  navigateToApply() {
    if (this.jobId) {
      this.router.navigate(['/apply', this.jobId]);
    }
  }

  goBack() {
    this.router.navigate(['/jobseeker']);
  }
}

