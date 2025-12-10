import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { LucideAngularModule } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header class="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <lucide-briefcase class="w-6 h-6 text-white" />
              </div>
              <h1 class="text-slate-900 text-xl font-bold">Jobs.ge</h1>
            </div>
            <button
              (click)="onGetStarted()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <div class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>

        <div class="container mx-auto px-4 py-16 max-w-7xl relative">
          <div class="text-center max-w-4xl mx-auto mb-12">
            <h1 class="text-5xl md:text-6xl mb-6 font-bold text-slate-900 leading-tight">
              Find Your Dream Job in Georgia
            </h1>
            <p class="text-slate-600 text-xl mb-8">
              Connect with top employers and track your applications in one place
            </p>
            <button
              (click)="onGetStarted()"
              class="text-lg px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2">
              Get Started
              <lucide-arrow-right class="w-5 h-5" />
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-briefcase class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">{{ stats.activeJobs }}</div>
              <div class="text-slate-600 text-sm">Active Jobs</div>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-building2 class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">350+</div>
              <div class="text-slate-600 text-sm">Companies</div>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-users class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">15,000+</div>
              <div class="text-slate-600 text-sm">Job Seekers</div>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-trending-up class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">87%</div>
              <div class="text-slate-600 text-sm">Success Rate</div>
            </div>
          </div>

          <!-- All Jobs Section -->
          <div class="mt-16">
            <div class="mb-8">
              <h2 class="text-3xl font-bold mb-2 text-slate-900">All Job Openings</h2>
              <p class="text-slate-600 mb-6">Explore our latest job opportunities</p>
              
              <!-- Search/Filter Input -->
              <div class="max-w-md">
                <div class="relative">
                  <lucide-search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    [(ngModel)]="searchTitle"
                    (ngModelChange)="filterJobs()"
                    placeholder="Search by job title..."
                    class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900">
                  <button
                    *ngIf="searchTitle"
                    (click)="clearFilter()"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <lucide-x class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="isLoading" class="text-center py-16">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p class="text-slate-600 mt-4">Loading jobs...</p>
            </div>

            <div *ngIf="!isLoading && filteredJobs.length === 0" class="text-center py-16 text-slate-600">
              <lucide-briefcase class="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p class="text-lg font-medium mb-2">No jobs found</p>
              <p *ngIf="searchTitle" class="text-sm">Try adjusting your search criteria</p>
              <p *ngIf="!searchTitle" class="text-sm">No active jobs available at the moment</p>
            </div>

            <div *ngIf="!isLoading && filteredJobs.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let job of filteredJobs"
                   (click)="onGetStarted()"
                   class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border border-slate-200 hover:border-blue-300">
                <h3 class="text-xl font-semibold mb-2 text-slate-900">{{ job.title }}</h3>
                <p class="text-slate-600 mb-4 line-clamp-2">{{ job.description }}</p>
                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-2 text-slate-600 text-sm">
                    <lucide-map-pin class="w-4 h-4" />
                    <span>{{ job.location }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600 text-sm" *ngIf="job.salary">
                    <lucide-dollar-sign class="w-4 h-4" />
                    <span>₾{{ job.salary }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600 text-sm">
                    <lucide-calendar class="w-4 h-4" />
                    <span>Deadline: {{ job.applicationDeadline | date }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                  <lucide-arrow-right class="w-5 h-5 text-blue-600" />
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
export class HomeComponent implements OnInit {
  allJobs: Job[] = [];
  filteredJobs: Job[] = [];
  searchTitle: string = '';
  isLoading = false;
  stats = {
    activeJobs: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.loadAllJobs();
  }

  loadAllJobs() {
    this.isLoading = true;
    this.jobService.getJobsByStatus(0).subscribe({ // 0 = Active
      next: (jobs: Job[]) => {
        this.allJobs = jobs;
        this.filteredJobs = jobs;
        this.stats.activeJobs = jobs.length;
        this.isLoading = false;
      },
      error: () => {
        this.allJobs = [];
        this.filteredJobs = [];
        this.isLoading = false;
      }
    });
  }

  filterJobs() {
    if (!this.searchTitle || this.searchTitle.trim() === '') {
      this.filteredJobs = this.allJobs;
      return;
    }

    const searchTerm = this.searchTitle.toLowerCase().trim();
    this.filteredJobs = this.allJobs.filter(job =>
      job.title.toLowerCase().includes(searchTerm)
    );
  }

  clearFilter() {
    this.searchTitle = '';
    this.filteredJobs = this.allJobs;
  }

  onGetStarted() {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 1) { // HR
        this.router.navigate(['/company']);
      } else {
        this.router.navigate(['/jobseeker']);
      }
    } else {
      this.router.navigate(['/auth']);
    }
  }
}
