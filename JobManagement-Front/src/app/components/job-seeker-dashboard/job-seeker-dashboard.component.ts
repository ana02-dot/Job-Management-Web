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
                <p class="text-3xl font-bold text-blue-600">{{ filteredJobs.length }}</p>
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

          <!-- Filters Section -->
          <div class="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <!-- Title Search -->
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Job Title</label>
                <div class="relative">
                  <lucide-search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    [(ngModel)]="filters.title"
                    (ngModelChange)="filterJobs()"
                    placeholder="Search by title..."
                    class="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
                </div>
              </div>

              <!-- Location -->
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Location</label>
                <input
                  type="text"
                  [(ngModel)]="filters.location"
                  (ngModelChange)="filterJobs()"
                  placeholder="e.g. Tbilisi"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
              </div>

              <!-- Work Type -->
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Work Type</label>
                <select
                  [(ngModel)]="filters.workType"
                  (ngModelChange)="filterJobs()"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
                  <option value="">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Category</label>
                <input
                  type="text"
                  [(ngModel)]="filters.category"
                  (ngModelChange)="filterJobs()"
                  placeholder="e.g. IT, Finance"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
              </div>

              <!-- Salary Min -->
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Min Salary (₾)</label>
                <input
                  type="number"
                  [(ngModel)]="filters.salaryMin"
                  (ngModelChange)="filterJobs()"
                  placeholder="Min"
                  min="0"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
              </div>

              <!-- Salary Max -->
              <div>
                <label class="block text-sm font-medium mb-1 text-slate-700">Max Salary (₾)</label>
                <input
                  type="number"
                  [(ngModel)]="filters.salaryMax"
                  (ngModelChange)="filterJobs()"
                  placeholder="Max"
                  min="0"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
              </div>
            </div>
            
            <!-- Clear Filters Button -->
            <div class="flex justify-end">
              <button
                (click)="clearFilters()"
                class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors bg-white">
                Clear All Filters
              </button>
            </div>
          </div>

          <div *ngIf="isLoadingJobs" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-slate-600 mt-2">Loading jobs...</p>
          </div>

          <div *ngIf="!isLoadingJobs && filteredJobs.length === 0" class="text-center py-8 text-slate-600">
            <p *ngIf="hasActiveFilters()" class="mb-2">No jobs found matching your filters. Try adjusting your search criteria.</p>
            <p *ngIf="!hasActiveFilters()">No active jobs available at the moment.</p>
          </div>

          <div *ngIf="!isLoadingJobs" class="space-y-4">
            <div *ngFor="let job of filteredJobs"
                 class="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ job.title }}</h3>

              <div class="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                <div class="flex items-center gap-1">
                  <lucide-map-pin class="w-4 h-4" />
                  <span>{{ job.location }}</span>
                </div>
                <div *ngIf="job.workType" class="flex items-center gap-1">
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{{ job.workType }}</span>
                </div>
                <div *ngIf="job.category" class="flex items-center gap-1">
                  <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{{ job.category }}</span>
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

              <div class="flex gap-2">
                <button
                  (click)="navigateToApply(job.id)"
                  [disabled]="hasApplied(job.id)"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <span *ngIf="!hasApplied(job.id)">View Details & Apply</span>
                  <span *ngIf="hasApplied(job.id)">Already Applied</span>
                </button>
              </div>
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
      // Title filter
      if (this.filters.title && !job.title.toLowerCase().includes(this.filters.title.toLowerCase().trim())) {
        return false;
      }

      // Location filter
      if (this.filters.location && !job.location.toLowerCase().includes(this.filters.location.toLowerCase().trim())) {
        return false;
      }

      // WorkType filter
      if (this.filters.workType && job.workType?.toLowerCase() !== this.filters.workType.toLowerCase()) {
        return false;
      }

      // Category filter
      if (this.filters.category && job.category && !job.category.toLowerCase().includes(this.filters.category.toLowerCase().trim())) {
        return false;
      }

      // Salary range filter
      if (this.filters.salaryMin !== null || this.filters.salaryMax !== null) {
        const jobSalary = this.parseSalary(job.salary);
        if (jobSalary === null) {
          // If job has no salary but filters require it, exclude it
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
    // Remove currency symbols and extract numeric value
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
