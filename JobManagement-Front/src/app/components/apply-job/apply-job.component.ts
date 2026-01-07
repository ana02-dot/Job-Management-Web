import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { JobApplicationService, CreateApplicationRequest, Application } from '../../services/job-application.service';
import { LucideAngularModule, Briefcase, MapPin, Calendar, DollarSign, ArrowLeft, Send, AlertCircle, CheckCircle, FileText } from 'lucide-angular';
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
            <div class="flex items-center gap-2 group cursor-pointer" (click)="router.navigate(['/'])">
              <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-8 w-auto" />
              <span class="text-xl font-bold text-white">
                - Apply for Job
              </span>
            </div>
            <button
              (click)="goBack()"
              class="px-4 py-2 text-slate-300 hover:text-white transition-colors flex items-center gap-2 border border-slate-700 rounded-lg hover:bg-slate-800">
              <lucide-arrow-left class="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <lucide-alert-circle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <h3 class="font-semibold text-red-400 mb-1">Error</h3>
            <p class="text-sm text-red-300 whitespace-pre-wrap">{{ errorMessage }}</p>
          </div>
          <button (click)="errorMessage = ''" class="text-red-400 hover:text-red-300">
            <lucide-alert-circle class="w-5 h-5" />
          </button>
        </div>

        <!-- Success Message -->
        <div *ngIf="successMessage" class="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
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
          
          <div class="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
            <div class="flex items-center gap-1">
              <lucide-map-pin class="w-4 h-4" />
              <span>{{ job.location }}</span>
            </div>
            <div *ngIf="job.workType" class="flex items-center gap-1">
              <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs font-medium">{{ job.workType }}</span>
            </div>
            <div *ngIf="job.category" class="flex items-center gap-1">
              <span class="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs font-medium">{{ job.category }}</span>
            </div>
            <div class="flex items-center gap-1" *ngIf="job.salary">
              <lucide-dollar-sign class="w-4 h-4" />
              <span>₾{{ job.salary }}</span>
            </div>
            <div class="flex items-center gap-1" *ngIf="job.applicationDeadline">
              <lucide-calendar class="w-4 h-4" />
              <span>Deadline: {{ job.applicationDeadline | date:'medium' }}</span>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="font-semibold text-slate-300 mb-2">Job Description</h3>
            <p class="text-slate-400 whitespace-pre-wrap">{{ job.description }}</p>
          </div>

          <div *ngIf="job.requirements" class="mb-4">
            <h3 class="font-semibold text-slate-300 mb-2">Requirements</h3>
            <p class="text-slate-400 whitespace-pre-wrap">{{ job.requirements }}</p>
          </div>
        </div>

        <!-- My Application Info (if already applied) -->
        <div *ngIf="!isLoadingJob && job && existingApplication" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 class="text-2xl font-bold mb-4 text-white">My Application</h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-sm text-slate-400">Application Status:</span>
                <span [class]="getStatusBadgeClass(existingApplication.status)" class="px-3 py-1 rounded-full text-sm font-medium ml-2">
                  {{ getStatusText(existingApplication.status) }}
                </span>
              </div>
            </div>

            <div class="text-sm text-slate-400 mb-4">
              <div class="flex items-center gap-2 mb-2">
                <lucide-calendar class="w-4 h-4" />
                <span>Applied on: {{ existingApplication.appliedAt | date:'medium' }}</span>
              </div>
              <div *ngIf="existingApplication.reviewedAt" class="flex items-center gap-2">
                <lucide-calendar class="w-4 h-4" />
                <span>Reviewed on: {{ existingApplication.reviewedAt | date:'medium' }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-slate-300">
                Your Resume / Cover Letter
              </label>
              <div class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white whitespace-pre-wrap min-h-[200px]">
                {{ existingApplication.resume }}
              </div>
            </div>
          </div>
        </div>

        <!-- Application Form (if not applied yet) -->
        <div *ngIf="!isLoadingJob && job && !existingApplication" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 class="text-2xl font-bold mb-4 text-white">Application Form</h2>
          
          <form (ngSubmit)="submitApplication()" class="space-y-6">
            <!-- User Information (Auto-filled, Read-only) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2 text-slate-300">First Name</label>
                <input
                  type="text"
                  [value]="userInfo.firstName"
                  readonly
                  class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed">
              </div>
              <div>
                <label class="block text-sm font-medium mb-2 text-slate-300">Last Name</label>
                <input
                  type="text"
                  [value]="userInfo.lastName"
                  readonly
                  class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-slate-300">Email</label>
              <input
                type="email"
                [value]="userInfo.email"
                readonly
                class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed">
            </div>


            <!-- Cover Letter (Optional) -->
            <div>
              <label class="block text-sm font-medium mb-2 text-slate-300">
                Cover Letter (Optional)
              </label>
              <textarea
                [(ngModel)]="applicationData.coverLetter"
                name="coverLetter"
                rows="6"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500"
                placeholder="Write a cover letter explaining why you're interested in this position..."></textarea>
              <p class="text-xs text-slate-500 mt-1">
                Optional: Include a cover letter explaining your interest and qualifications for this position.
              </p>
            </div>

            <div *ngIf="isDeadlinePassed()" class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <lucide-alert-circle class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-yellow-300">The application deadline for this job has passed. You cannot submit an application.</p>
                </div>
              </div>
            </div>

            <div *ngIf="!isJobActive() && job" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <lucide-alert-circle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-red-300">This job is no longer accepting applications.</p>
                </div>
              </div>
            </div>

            <!-- CV Required Warning -->
            <div *ngIf="!isLoadingProfile && !hasCvUploaded" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <lucide-alert-circle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h4 class="font-semibold text-red-400 mb-1">CV Required</h4>
                  <p class="text-sm text-red-300 mb-2">You must upload your CV before submitting an application. Please go to your profile and upload your CV.</p>
                  <button
                    type="button"
                    (click)="router.navigate(['/jobseeker'])"
                    class="text-sm px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">
                    Go to Profile to Upload CV
                  </button>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                type="submit"
                [disabled]="isSubmitting || isDeadlinePassed() || !isJobActive() || !hasCvUploaded || isLoadingProfile"
                class="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <lucide-send class="w-5 h-5" />
                <span *ngIf="!isSubmitting">Submit Application</span>
                <span *ngIf="isSubmitting">Submitting...</span>
              </button>
              <button
                type="button"
                (click)="goBack()"
                class="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
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
            class="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
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
  existingApplication: Application | null = null;
  isLoadingApplication = false;
  isLoadingProfile = false;
  hasCvUploaded = false;
  userInfo = {
    firstName: '',
    lastName: '',
    email: ''
  };
  
  applicationData: CreateApplicationRequest = {
    jobId: 0,
    applicantId: 0,
    resume: '',
    coverLetter: ''
  };

  constructor(
    public router: Router,
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

    this.userInfo = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || ''
    };

    // Get job ID from route params
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      console.log('Route params:', params);
      console.log('Job ID from route:', idParam);
      
      if (idParam) {
        this.jobId = +idParam;
        if (this.jobId && this.jobId > 0) {
          console.log('Valid job ID, loading job:', this.jobId);
          this.loadJob();
          this.applicationData.jobId = this.jobId;
          this.applicationData.applicantId = user.id;
          this.checkUserCv();
        } else {
          console.error('Invalid job ID:', this.jobId);
          this.errorMessage = 'Invalid job ID. Please select a valid job.';
          this.isLoadingJob = false;
        }
      } else {
        console.error('No job ID in route params');
        this.errorMessage = 'No job ID provided. Please select a job to apply for.';
        this.isLoadingJob = false;
      }
    });
  }


  loadJob() {
    this.isLoadingJob = true;
    this.errorMessage = '';
    console.log('Loading job with ID:', this.jobId);
    this.jobService.getJobById(this.jobId).subscribe({
      next: (job: Job) => {
        console.log('Job loaded successfully:', job);
        this.job = job;
        this.isLoadingJob = false;
        this.checkExistingApplication();
      },
      error: (error: any) => {
        console.error('Error loading job:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error error:', error.error);
        
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

  isDeadlinePassed(): boolean {
    if (!this.job || !this.job.applicationDeadline) {
      return false;
    }
    const deadline = new Date(this.job.applicationDeadline);
    const now = new Date();
    return deadline < now;
  }

  isJobActive(): boolean {
    if (!this.job) {
      return false;
    }
    // JobStatus: 0 = Active, 1 = Closed, 2 = Cancelled
    return this.job.status === 0;
  }

  checkUserCv() {
    this.isLoadingProfile = true;
    this.authService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.hasCvUploaded = !!(profile.cvUrl && profile.cvUrl.trim().length > 0);
        this.isLoadingProfile = false;
        if (!this.hasCvUploaded) {
          console.warn('User has not uploaded a CV');
        }
      },
      error: (error) => {
        console.error('Error checking user profile:', error);
        this.isLoadingProfile = false;
        this.hasCvUploaded = false;
      }
    });
  }

  submitApplication() {
    if (!this.hasCvUploaded) {
      this.errorMessage = 'CV is required to submit an application. Please upload your CV in your profile before applying for jobs.';
      return;
    }

    if (this.isDeadlinePassed()) {
      this.errorMessage = 'The application deadline for this job has passed.';
      return;
    }

    if (!this.isJobActive()) {
      this.errorMessage = 'This job is no longer accepting applications.';
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

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Submitting application for job:', this.applicationData.jobId);

    this.jobApplicationService.createApplicationWithFile(
      this.applicationData.jobId,
      null,
      this.applicationData.coverLetter || ''
    ).subscribe({
      next: (response) => {
        console.log('Application submitted successfully:', response);
        this.successMessage = 'Your application has been submitted successfully! We will review it and get back to you soon.';
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.router.navigate(['/jobseeker']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error submitting application:', error);
        
        const errorObj = error?.originalError || error;
        let message = 'Failed to submit application. ';
        
        if (error?.message) {
          message = error.message;
        } else if (errorObj?.error?.message) {
          message = errorObj.error.message;
        } else if (errorObj?.message) {
          message = errorObj.message;
        } else if (typeof errorObj?.error === 'string') {
          message = errorObj.error;
        }

        const status = error?.status ?? errorObj?.status ?? 0;
        if (status === 400) {
          const errorMsg = message.toLowerCase();
          if (errorMsg.includes('cv') && (errorMsg.includes('required') || errorMsg.includes('upload'))) {
            message = 'CV is required to submit an application. Please upload your CV in your profile before applying for jobs.';
            this.hasCvUploaded = false;
          } else if (errorMsg.includes('already applied')) {
            message = 'You have already applied for this job.';
          } else if (errorMsg.includes('deadline')) {
            message = 'The application deadline for this job has passed.';
          } else if (errorMsg.includes('not accepting')) {
            message = 'This job is no longer accepting applications.';
          } else if (errorMsg.includes('bad request')) {
            message = 'Invalid request. Please check your application details.';
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

  checkExistingApplication() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.jobId) return;

    this.isLoadingApplication = true;
    this.jobApplicationService.getApplicationsByApplicantId(user.id).subscribe({
      next: (applications: Application[]) => {
        const application = applications.find(app => app.jobId === this.jobId);
        if (application) {
          this.existingApplication = application;
          console.log('Found existing application:', application);
        } else {
          this.existingApplication = null;
        }
        this.isLoadingApplication = false;
      },
      error: (error: any) => {
        console.error('Error checking existing application:', error);
        this.existingApplication = null;
        this.isLoadingApplication = false;
      }
    });
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Under Review',
      2: 'Approved',
      3: 'Rejected'
    };
    return statusMap[status] || 'Unknown';
  }

  getStatusBadgeClass(status: number): string {
    const classMap: { [key: number]: string } = {
      0: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      1: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      2: 'bg-green-500/10 text-green-400 border border-green-500/20',
      3: 'bg-red-500/10 text-red-400 border border-red-500/20'
    };
    return classMap[status] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }

  goBack() {
    this.router.navigate(['/jobseeker']);
  }
}

