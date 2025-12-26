import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { JobApplicationService, CreateApplicationRequest } from '../../services/job-application.service';
import { LucideAngularModule, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-apply-job',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-slate-900">
      <!-- Header -->
      <header class="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-8 w-auto" />
              <h1 class="text-xl font-bold text-white">Apply for Job</h1>
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

      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <lucide-alert-circle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <h3 class="font-semibold text-red-400 mb-1">Error</h3>
            <p class="text-sm text-red-300 whitespace-pre-wrap">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Success Message -->
        <div *ngIf="successMessage" class="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <lucide-check-circle class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-green-300">{{ successMessage }}</p>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoadingJob" class="text-center py-16">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p class="text-slate-400 mt-4">Loading job details...</p>
        </div>

        <!-- Job Details Card -->
        <div *ngIf="!isLoadingJob && job" class="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
          <h2 class="text-2xl font-bold mb-4 text-white">{{ job.title }}</h2>
          
          <div class="flex flex-wrap gap-4 text-sm text-slate-300 mb-4">
            <div class="flex items-center gap-2">
              <img src="/assets/images/location-asset.png" alt="Location" class="w-4 h-4 object-contain" />
              <span>{{ job.location }}</span>
            </div>
            <div class="flex items-center gap-2" *ngIf="job.salary">
              <img src="/assets/images/salary.png" alt="Salary" class="w-4 h-4 object-contain" />
              <span>₾{{ job.salary }}</span>
            </div>
            <div class="flex items-center gap-2" *ngIf="job.applicationDeadline">
              <img src="/assets/images/deadline.png" alt="Deadline" class="w-4 h-4 object-contain" />
              <span>Deadline: {{ job.applicationDeadline | date:'medium' }}</span>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="font-semibold text-white mb-2">Job Description</h3>
            <p class="text-slate-300 whitespace-pre-wrap">{{ job.description }}</p>
          </div>

          <div *ngIf="job.requirements" class="mb-4">
            <h3 class="font-semibold text-white mb-2">Requirements</h3>
            <p class="text-slate-300 whitespace-pre-wrap">{{ job.requirements }}</p>
          </div>
        </div>

        <!-- Application Form -->
        <div *ngIf="!isLoadingJob && job" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 class="text-2xl font-bold mb-6 text-white">Application Form</h2>
          
          <form (ngSubmit)="submitApplication()" class="space-y-6">
            <!-- Resume / Cover Letter -->
            <div>
              <label class="block text-sm font-medium mb-2 text-slate-300">
                Resume / Cover Letter <span class="text-red-400">*</span>
              </label>
              <textarea
                [(ngModel)]="applicationData.resume"
                name="resume"
                rows="10"
                class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-slate-500"
                placeholder="Please provide your resume, cover letter, or any relevant information about your qualifications and experience..."
                required></textarea>
              <p class="text-xs text-slate-400 mt-1">
                Include your work experience, education, skills, and why you're interested in this position.
              </p>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                [disabled]="isSubmitting || !applicationData.resume?.trim()"
                class="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                <lucide-send class="w-5 h-5" />
                <span *ngIf="!isSubmitting">Submit Application</span>
                <span *ngIf="isSubmitting">Submitting...</span>
              </button>
              <button
                type="button"
                (click)="goBack()"
                class="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Job Not Found -->
        <div *ngIf="!isLoadingJob && !job" class="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center">
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
export class ApplyJobComponent implements OnInit {
  job: Job | null = null;
  jobId: number = 0;
  isLoadingJob = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  applicationData: CreateApplicationRequest = {
    jobId: 0,
    applicantId: 0,
    resume: ''
  };

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

    // Get job ID from route params
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.jobId = +idParam;
        if (this.jobId && this.jobId > 0) {
          this.loadJob();
          this.applicationData.jobId = this.jobId;
          this.applicationData.applicantId = user.id;
        } else {
          this.errorMessage = 'Invalid job ID. Please select a valid job.';
          this.isLoadingJob = false;
        }
      } else {
        this.errorMessage = 'No job ID provided. Please select a job to apply for.';
        this.isLoadingJob = false;
      }
    });
  }

  loadJob() {
    this.isLoadingJob = true;
    this.errorMessage = '';
    this.jobService.getJobById(this.jobId).subscribe({
      next: (job: Job) => {
        this.job = job;
        this.isLoadingJob = false;
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
          message += 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.error?.message) {
          message += error.error.message;
        } else if (error.message) {
          message += error.message;
        } else {
          message += 'Unknown error occurred.';
        }
        
        this.errorMessage = message;
        this.isLoadingJob = false;
      }
    });
  }

  submitApplication() {
    if (!this.applicationData.resume?.trim()) {
      this.errorMessage = 'Please provide your resume or cover letter.';
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'You must be logged in to apply for jobs.';
      this.router.navigate(['/auth']);
      return;
    }

    if (user.role !== 2) { // 2 = Applicant
      this.errorMessage = 'Only applicants can apply for jobs.';
      return;
    }

    if (!this.applicationData.jobId || this.applicationData.jobId <= 0) {
      this.errorMessage = 'Invalid job ID. Please select a valid job.';
      return;
    }

    if (!this.applicationData.applicantId || this.applicationData.applicantId <= 0) {
      this.errorMessage = 'Invalid user ID. Please logout and login again.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const application: CreateApplicationRequest = {
      jobId: this.applicationData.jobId,
      applicantId: this.applicationData.applicantId,
      resume: this.applicationData.resume.trim()
    };

    console.log('Submitting application:', application);

    this.jobApplicationService.createApplication(application).subscribe({
      next: (response) => {
        console.log('Application submitted successfully:', response);
        this.successMessage = 'Your application has been submitted successfully! We will review it and get back to you soon.';
        this.isSubmitting = false;
        
        // Redirect to job seeker dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/jobseeker']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error submitting application:', error);
        
        // Handle error from interceptor (which wraps the original error)
        const errorObj = error?.originalError || error;
        let message = 'Failed to submit application. ';
        
        // Try to get message from various possible locations
        if (error?.message) {
          message = error.message;
        } else if (errorObj?.error?.message) {
          message = errorObj.error.message;
        } else if (errorObj?.message) {
          message = errorObj.message;
        } else if (typeof errorObj?.error === 'string') {
          message = errorObj.error;
        }

        // Handle specific error cases
        const status = error?.status ?? errorObj?.status ?? 0;
        if (status === 400) {
          const errorMsg = message.toLowerCase();
          if (errorMsg.includes('already applied')) {
            message = 'You have already applied for this job.';
          } else if (errorMsg.includes('deadline')) {
            message = 'The application deadline for this job has passed.';
          } else if (errorMsg.includes('not accepting')) {
            message = 'This job is no longer accepting applications.';
          }
        } else if (status === 401) {
          message = 'Your session has expired. Please logout and login again.';
        } else if (status === 403) {
          message = 'You do not have permission to apply for jobs. Please ensure you are logged in as an Applicant.';
        } else if (status === 0) {
          message = 'Cannot connect to server. Please check if the backend is running.';
        } else if (status === 404) {
          message = 'Job not found. The job may have been removed.';
        } else if (status >= 500) {
          message = 'Server error. Please try again later.';
        }

        this.errorMessage = message;
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/jobseeker']);
  }
}
