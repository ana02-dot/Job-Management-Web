import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { JobApplicationService, Application, CreateApplicationRequest } from '../../services/job-application.service';
import { LucideAngularModule, Search } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-job-seeker-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-slate-900">
      <header class="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2 group cursor-pointer" (click)="router.navigate(['/'])">
              <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-8 w-auto" />
              <span class="text-xl font-bold text-white">
                - Job Seeker
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-slate-300">
                <lucide-user class="w-4 h-4" />
                <span class="font-medium">{{ userName }}</span>
              </div>
              <button
                  (click)="logout()"
                  class="px-4 py-2 bg-red-600/20 border border-red-600/50 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2">
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
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-400 mb-1">Available Jobs</p>
                <p class="text-3xl font-bold text-cyan-400">{{ filteredJobs.length }}</p>
              </div>
              <lucide-briefcase class="w-10 h-10 text-cyan-400" />
            </div>
          </div>
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-400 mb-1">My Applications</p>
                <p class="text-3xl font-bold text-purple-400">{{ myApplications.length }}</p>
              </div>
              <lucide-file-text class="w-10 h-10 text-purple-400" />
            </div>
          </div>
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-400 mb-1">Pending</p>
                <p class="text-3xl font-bold text-yellow-400">{{ getPendingCount() }}</p>
              </div>
              <lucide-clock class="w-10 h-10 text-yellow-400" />
            </div>
          </div>
        </div>

        <div class="bg-slate-800 rounded-lg border border-slate-700 mb-6">
          <div class="border-b border-slate-700">
            <div class="flex">
              <button
                  (click)="activeTab = 'jobs'"
                  [class.border-b-2]="activeTab === 'jobs'"
                  [class.border-cyan-500]="activeTab === 'jobs'"
                  [class.text-cyan-400]="activeTab === 'jobs'"
                  [class.text-slate-400]="activeTab !== 'jobs'"
                  class="px-6 py-3 font-medium transition-colors">
                Available Jobs
              </button>
              <button
                  (click)="activeTab = 'applications'"
                  [class.border-b-2]="activeTab === 'applications'"
                  [class.border-cyan-500]="activeTab === 'applications'"
                  [class.text-cyan-400]="activeTab === 'applications'"
                  [class.text-slate-400]="activeTab !== 'applications'"
                  class="px-6 py-3 font-medium transition-colors">
                My Applications
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'jobs'" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 class="text-2xl font-bold mb-4 text-white">Browse Jobs</h2>

          <div class="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-300">Job Title</label>
                <div class="relative">
                  <lucide-search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                      type="text"
                      [(ngModel)]="filters.title"
                      (ngModelChange)="filterJobs()"
                      placeholder="Search by title..."
                      class="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-300">Location</label>
                <input
                    type="text"
                    [(ngModel)]="filters.location"
                    (ngModelChange)="filterJobs()"
                    placeholder="e.g. Tbilisi"
                    class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-300">Work Type</label>
                <select
                    [(ngModel)]="filters.workType"
                    (ngModelChange)="filterJobs()"
                    class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white">
                  <option value="">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-300">Category</label>
                <input
                    type="text"
                    [(ngModel)]="filters.category"
                    (ngModelChange)="filterJobs()"
                    placeholder="e.g. IT, Finance"
                    class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-300">Min Salary (₾)</label>
                <input
                    type="number"
                    [(ngModel)]="filters.salaryMin"
                    (ngModelChange)="filterJobs()"
                    placeholder="Min"
                    min="0"
                    class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-300">Max Salary (₾)</label>
                <input
                    type="number"
                    [(ngModel)]="filters.salaryMax"
                    (ngModelChange)="filterJobs()"
                    placeholder="Max"
                    min="0"
                    class="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500">
              </div>
            </div>

            <!-- Clear Filters Button -->
            <div class="flex justify-end">
              <button
                  (click)="clearFilters()"
                  class="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
                Clear All Filters
              </button>
            </div>
          </div>

          <div *ngIf="isLoadingJobs" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <p class="text-slate-400 mt-2">Loading jobs...</p>
          </div>

          <div *ngIf="!isLoadingJobs && filteredJobs.length === 0" class="text-center py-8 text-slate-400">
            <p *ngIf="hasActiveFilters()" class="mb-2">No jobs found matching your filters. Try adjusting your search criteria.</p>
            <p *ngIf="!hasActiveFilters()">No active jobs available at the moment.</p>
          </div>

          <div *ngIf="!isLoadingJobs" class="space-y-4">
            <div *ngFor="let job of filteredJobs"
                 class="border border-slate-700 rounded-lg p-6 bg-slate-900/50 hover:border-cyan-500/50 transition-all">
              <h3 class="text-xl font-semibold text-white mb-2">{{ job.title }}</h3>

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
                <div class="flex items-center gap-1">
                  <lucide-calendar class="w-4 h-4" />
                  <span>Deadline: {{ job.applicationDeadline | date }}</span>
                </div>
              </div>

              <p class="text-slate-400 mb-3">{{ job.description }}</p>

              <div *ngIf="job.requirements" class="mb-4">
                <div class="font-medium text-slate-300 mb-1">Requirements:</div>
                <p class="text-sm text-slate-400">{{ job.requirements }}</p>
              </div>

              <div class="flex gap-2">
                <button
                    (click)="navigateToApply(job.id)"
                    [disabled]="hasApplied(job.id)"
                    class="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <span *ngIf="!hasApplied(job.id)">View Details & Apply</span>
                  <span *ngIf="hasApplied(job.id)">Already Applied</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'applications'" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 class="text-2xl font-bold mb-4 text-white">My Applications</h2>

          <div *ngIf="isLoadingApplications" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <p class="text-slate-400 mt-2">Loading applications...</p>
          </div>

          <div *ngIf="!isLoadingApplications && myApplications.length === 0" class="text-center py-8 text-slate-400">
            You haven't applied to any jobs yet.
          </div>

          <div *ngIf="!isLoadingApplications" class="space-y-4">
            <div *ngFor="let app of myApplications"
                 class="border border-slate-700 rounded-lg p-6 bg-slate-900/50">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-white">Application #{{ app.id }}</h3>
                  <p class="text-sm text-slate-400">Job ID: {{ app.jobId }}</p>
                  <p class="text-sm text-slate-400">Applied: {{ app.appliedAt | date:'medium' }}</p>
                </div>
                <span [class]="getStatusBadgeClass(app.status)" class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ getStatusText(app.status) }}
                </span>
              </div>
              <div *ngIf="app.resume" class="text-sm text-slate-400">
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
  filteredJobs: Job[] = [];
  myApplications: Application[] = [];
  isLoadingJobs = false;
  isLoadingApplications = false;
  activeTab: 'jobs' | 'applications' = 'jobs';
  currentUserId = 0;

  filters = {
    title: '',
    location: '',
    workType: '',
    category: '',
    salaryMin: null as number | null,
    salaryMax: null as number | null
  };

  constructor(
      public router: Router,
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
        this.filteredJobs = jobs;
        this.filterJobs();
        this.isLoadingJobs = false;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.isLoadingJobs = false;
      }
    });
  }

  filterJobs() {
    this.filteredJobs = this.availableJobs.filter(job => {
      if (this.filters.title && !job.title.toLowerCase().includes(this.filters.title.toLowerCase().trim())) {
        return false;
      }

      if (this.filters.location && !job.location.toLowerCase().includes(this.filters.location.toLowerCase().trim())) {
        return false;
      }

      if (this.filters.workType && job.workType?.toLowerCase() !== this.filters.workType.toLowerCase()) {
        return false;
      }

      if (this.filters.category && job.category && !job.category.toLowerCase().includes(this.filters.category.toLowerCase().trim())) {
        return false;
      }

      if (this.filters.salaryMin !== null || this.filters.salaryMax !== null) {
        const jobSalary = this.parseSalary(job.salary);
        if (jobSalary === null) {
          if (this.filters.salaryMin !== null) {
            return false;
          }
        } else {
          if (this.filters.salaryMin !== null && jobSalary < this.filters.salaryMin) {
            return false;
          }
          if (this.filters.salaryMax !== null && jobSalary > this.filters.salaryMax) {
            return false;
          }
        }
      }

      return true;
    });
  }

  parseSalary(salary?: string): number | null {
    if (!salary) return null;
    const numericValue = salary.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(numericValue);
    return isNaN(parsed) ? null : parsed;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.title || this.filters.location || this.filters.workType ||
        this.filters.category || this.filters.salaryMin !== null || this.filters.salaryMax !== null);
  }

  clearFilters() {
    this.filters = {
      title: '',
      location: '',
      workType: '',
      category: '',
      salaryMin: null,
      salaryMax: null
    };
    this.filteredJobs = this.availableJobs;
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

  navigateToApply(jobId: number) {
    if (this.hasApplied(jobId)) {
      return;
    }
    this.router.navigate(['/apply', jobId]);
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
      0: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      1: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      2: 'bg-green-500/10 text-green-400 border border-green-500/20',
      3: 'bg-red-500/10 text-red-400 border border-red-500/20',
      4: 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
    };
    return classMap[status] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
