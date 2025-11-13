import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { JobApplicationService } from '../../services/job-application.service';
import { LucideAngularModule, Briefcase, MapPin, Clock, LogOut, User, Send } from 'lucide-angular';

@Component({
  selector: 'app-job-seeker-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2">
              <lucide-briefcase class="w-6 h-6 text-blue-600" />
              <h1 class="text-xl font-bold text-slate-900">Jobs.ge - Job Seeker Dashboard</h1>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-slate-600">
                <lucide-user class="w-4 h-4" />
                <span>{{ userName }}</span>
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
        <div class="mb-8">
          <h2 class="text-3xl font-bold mb-4">Available Jobs</h2>
          <div *ngIf="isLoading" class="text-center py-8">Loading jobs...</div>
          <div *ngIf="!isLoading && jobs.length === 0" class="text-center py-8 text-slate-600">
            No jobs available at the moment.
          </div>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let job of jobs" class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all border border-slate-200 hover:border-blue-300">
            <h3 class="text-xl font-semibold mb-2 text-slate-900">{{ job.title }}</h3>
            <p class="text-slate-600 mb-4 line-clamp-3">{{ job.description }}</p>
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm text-slate-600">
                <lucide-map-pin class="w-4 h-4" />
                <span>{{ job.location }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-slate-600">
                <lucide-briefcase class="w-4 h-4" />
                <span>{{ job.employmentType }}</span>
              </div>
              <div *ngIf="job.salary" class="flex items-center gap-2 text-sm text-slate-600">
                <lucide-clock class="w-4 h-4" />
                <span>{{ job.salary }}</span>
              </div>
            </div>
            <button
              (click)="applyForJob(job.id)"
              [disabled]="isApplying"
              class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
              <lucide-send class="w-4 h-4" />
              {{ isApplying ? 'Applying...' : 'Apply Now' }}
            </button>
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
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class JobSeekerDashboardComponent implements OnInit {
  userName = '';
  jobs: Job[] = [];
  isLoading = false;
  isApplying = false;

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

    this.userName = user.firstName || user.email;
    this.loadJobs();
  }

  loadJobs() {
    this.isLoading = true;
    // Get published jobs (status = 1)
    this.jobService.getJobsByStatus(1).subscribe({
      next: (jobs: Job[]) => {
        this.jobs = jobs;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
      }
    });
  }

  applyForJob(jobId: number) {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    this.isApplying = true;
    const application = {
      jobId: jobId,
      applicantId: user.id
    };

    this.jobApplicationService.submitApplication(application).subscribe({
      next: () => {
        alert('Application submitted successfully!');
        this.isApplying = false;
      },
      error: (error: any) => {
        console.error('Error submitting application:', error);
        alert(error.error?.message || 'Failed to submit application');
        this.isApplying = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

