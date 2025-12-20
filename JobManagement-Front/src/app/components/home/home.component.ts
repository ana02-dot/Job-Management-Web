import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
    <div class="min-h-screen bg-slate-900 text-gray-100">
      <header class="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div class="container mx-auto px-4 h-20 flex items-center justify-between">
          <div class="flex items-center gap-2 group cursor-pointer" (click)="scrollToTop()">
            <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-10 w-auto" />
          </div>
          <nav class="hidden md:flex items-center gap-6">
            <a (click)="router.navigate(['/auth'])" class="text-sm font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer">
              Sign In
            </a>
            <button
                (click)="onGetStarted()"
                class="h-9 px-4 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              Post a Job
            </button>
          </nav>
          <button
              (click)="onGetStarted()"
              class="md:hidden px-4 py-2 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors">
            Get Started
          </button>
        </div>
      </header>

      <section class="relative py-24 md:py-40 overflow-hidden">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" style="animation-delay: 1s;"></div>

        <div class="container mx-auto px-4 text-center">
          <h1 class="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight leading-tight">
            Find Your Next <br class="hidden md:block" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Dream Career
            </span>
          </h1>

          <p class="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed">
            Discover thousands of remote and on-site opportunities. Your future step starts here.
          </p>
          <div class="max-w-5xl mx-auto bg-slate-800/50 p-3 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-2xl">
            <div class="flex flex-col md:flex-row gap-3">
              <div class="flex-1 relative group">
                <lucide-search class="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                <input
                    type="text"
                    [(ngModel)]="filters.title"
                    (ngModelChange)="filterJobs()"
                    placeholder="Job title, keywords, or company"
                    class="w-full h-16 pl-14 pr-4 bg-slate-900/50 rounded-xl border border-transparent focus:border-cyan-500/50 focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 text-lg text-white placeholder-slate-500 outline-none transition-all">
              </div>
              <div class="flex-1 relative group">
                <lucide-map-pin class="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                    type="text"
                    [(ngModel)]="filters.location"
                    (ngModelChange)="filterJobs()"
                    placeholder="Location or 'Remote'"
                    class="w-full h-16 pl-14 pr-4 bg-slate-900/50 rounded-xl border border-transparent focus:border-purple-500/50 focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 text-lg text-white placeholder-slate-500 outline-none transition-all">
              </div>
              <button
                  (click)="onGetStarted()"
                  class="md:w-auto w-full h-16 px-10 text-xl font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                Search Jobs
              </button>
            </div>
          </div>
          <div class="mt-10 flex flex-wrap justify-center gap-4 text-base text-slate-400">
            <span>Popular:</span>
            <a
                *ngFor="let tag of popularCategories"
                (click)="filterByCategory(tag); $event.preventDefault()"
                class="hover:text-cyan-400 underline decoration-slate-700 hover:decoration-cyan-400 underline-offset-4 transition-all cursor-pointer">
              {{ tag }}
            </a>
          </div>
        </div>
      </section>
      <section class="bg-slate-800/30 py-8 border-y border-slate-800">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2 text-slate-300">Work Type</label>
                <select
                    [(ngModel)]="filters.workType"
                    (ngModelChange)="filterJobs()"
                    class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white">
                  <option value="">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2 text-slate-300">Category</label>
                <input
                    type="text"
                    [(ngModel)]="filters.category"
                    (ngModelChange)="filterJobs()"
                    placeholder="e.g. IT, Finance"
                    class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder-slate-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-2 text-slate-300">Min Salary (₾)</label>
                <input
                    type="number"
                    [(ngModel)]="filters.salaryMin"
                    (ngModelChange)="filterJobs()"
                    placeholder="Min"
                    min="0"
                    class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder-slate-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-2 text-slate-300">Max Salary (₾)</label>
                <input
                    type="number"
                    [(ngModel)]="filters.salaryMax"
                    (ngModelChange)="filterJobs()"
                    placeholder="Max"
                    min="0"
                    class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder-slate-500">
              </div>

              <div class="flex items-end">
                <button
                    (click)="clearFilters()"
                    class="w-full px-4 py-2.5 text-sm text-slate-400 hover:text-white font-medium border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-slate-900 py-16">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="flex items-center justify-between mb-12">
            <div>
              <h2 class="text-4xl md:text-5xl font-bold text-white mb-2">Top Jobs</h2>
              <p class="text-slate-400 text-lg">Most popular job openings</p>
            </div>
            <button
                (click)="onGetStarted()"
                class="hidden md:block px-6 py-2.5 text-cyan-400 border-2 border-cyan-500/50 rounded-lg hover:bg-cyan-500/10 transition-colors font-medium">
              View All Jobs
            </button>
          </div>

          <div *ngIf="isLoading" class="text-center py-16">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p class="text-slate-400 mt-4">Loading jobs...</p>
          </div>

          <div *ngIf="!isLoading && filteredJobs.length === 0" class="text-center py-16">
            <lucide-briefcase class="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p class="text-lg font-medium text-white mb-2">No jobs found</p>
            <p *ngIf="hasActiveFilters()" class="text-slate-400">Try adjusting your search criteria</p>
            <p *ngIf="!hasActiveFilters()" class="text-slate-400">No active jobs available at the moment</p>
          </div>

          <div *ngIf="!isLoading && filteredJobs.length > 0"
               #jobsContainer
               class="jobs-scroll-container overflow-hidden relative"
               (mouseenter)="pauseScroll()"
               (mouseleave)="resumeScroll()">
            <div class="jobs-track flex gap-6"
                 [style.animation-play-state]="isScrollingPaused ? 'paused' : 'running'">
              <div *ngFor="let job of filteredJobs; let i = index"
                   (mouseenter)="pauseScroll()"
                   (mouseleave)="resumeScroll()"
                   (click)="onGetStarted()"
                   class="group relative flex flex-col justify-between bg-slate-800 rounded-r-2xl rounded-l-sm p-8 border-l-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.15)] flex-shrink-0 w-full md:w-[500px]"
                   [ngClass]="getJobBorderColor(job.category)">
                <div class="mb-6">
                <span
                    class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border"
                    [ngClass]="getJobBadgeColor(job.category)">
                  {{ job.category || 'General' }}
                </span>
                  <h3 class="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 mb-2">
                    {{ job.title }}
                  </h3>
                </div>

                <div class="flex flex-wrap gap-5 mb-8 text-base text-slate-300">
                  <div class="flex items-center">
                    <lucide-map-pin class="w-5 h-5 mr-2 text-cyan-500" />
                    {{ job.location }}
                  </div>
                  <div class="flex items-center" *ngIf="job.workType">
                    <lucide-briefcase class="w-5 h-5 mr-2 text-purple-500" />
                    {{ job.workType }}
                  </div>
                  <div class="flex items-center">
                    <lucide-calendar class="w-5 h-5 mr-2 text-pink-500" />
                    {{ job.applicationDeadline | date:'shortDate' }}
                  </div>
                </div>

                <p class="text-slate-400 mb-6 line-clamp-2">{{ job.description }}</p>

                <div class="flex flex-wrap gap-3 mb-8" *ngIf="job.workType || job.category">
                <span *ngIf="job.workType" class="px-3 py-1.5 bg-slate-900 rounded-lg text-sm text-slate-400 border border-slate-700 font-medium">
                  {{ job.workType }}
                </span>
                  <span *ngIf="job.category" class="px-3 py-1.5 bg-slate-900 rounded-lg text-sm text-slate-400 border border-slate-700 font-medium">
                  {{ job.category }}
                </span>
                </div>

                <div class="flex items-center justify-between mt-auto pt-8 border-t border-slate-700/50">
                  <span *ngIf="job.salary" class="text-xl font-bold text-white">₾{{ job.salary }}</span>
                  <span *ngIf="!job.salary" class="text-lg text-slate-500">Salary not specified</span>
                  <button class="px-4 py-2 text-sm font-medium text-white bg-transparent border-2 border-slate-600 rounded-lg group-hover:bg-cyan-500 group-hover:border-cyan-500 group-hover:text-white transition-all duration-300 inline-flex items-center gap-2">
                    Apply Now
                    <lucide-arrow-right class="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
              <div *ngFor="let job of filteredJobs; let i = index"
                   (mouseenter)="pauseScroll()"
                   (mouseleave)="resumeScroll()"
                   (click)="onGetStarted()"
                   class="group relative flex flex-col justify-between bg-slate-800 rounded-r-2xl rounded-l-sm p-8 border-l-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.15)] flex-shrink-0 w-full md:w-[500px]"
                   [ngClass]="getJobBorderColor(job.category)">
                <div class="mb-6">
                  <span
                      class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border"
                      [ngClass]="getJobBadgeColor(job.category)">
                    {{ job.category || 'General' }}
                  </span>
                  <h3 class="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 mb-2">
                    {{ job.title }}
                  </h3>
                </div>

                <div class="flex flex-wrap gap-5 mb-8 text-base text-slate-300">
                  <div class="flex items-center">
                    <lucide-map-pin class="w-5 h-5 mr-2 text-cyan-500" />
                    {{ job.location }}
                  </div>
                  <div class="flex items-center" *ngIf="job.workType">
                    <lucide-briefcase class="w-5 h-5 mr-2 text-purple-500" />
                    {{ job.workType }}
                  </div>
                  <div class="flex items-center">
                    <lucide-calendar class="w-5 h-5 mr-2 text-pink-500" />
                    {{ job.applicationDeadline | date:'shortDate' }}
                  </div>
                </div>

                <p class="text-slate-400 mb-6 line-clamp-2">{{ job.description }}</p>

                <div class="flex flex-wrap gap-3 mb-8" *ngIf="job.workType || job.category">
                  <span *ngIf="job.workType" class="px-3 py-1.5 bg-slate-900 rounded-lg text-sm text-slate-400 border border-slate-700 font-medium">
                    {{ job.workType }}
                  </span>
                  <span *ngIf="job.category" class="px-3 py-1.5 bg-slate-900 rounded-lg text-sm text-slate-400 border border-slate-700 font-medium">
                    {{ job.category }}
                  </span>
                </div>

                <div class="flex items-center justify-between mt-auto pt-8 border-t border-slate-700/50">
                  <span *ngIf="job.salary" class="text-xl font-bold text-white">₾{{ job.salary }}</span>
                  <span *ngIf="!job.salary" class="text-lg text-slate-500">Salary not specified</span>
                  <button class="px-4 py-2 text-sm font-medium text-white bg-transparent border-2 border-slate-600 rounded-lg group-hover:bg-cyan-500 group-hover:border-cyan-500 group-hover:text-white transition-all duration-300 inline-flex items-center gap-2">
                    Apply Now
                    <lucide-arrow-right class="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-slate-800/30 py-16 border-y border-slate-800">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-3">
                {{ stats.applicants }}
              </div>
              <div class="text-slate-400 text-lg">Applicants</div>
            </div>
            <div class="text-center">
              <div class="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-3">
                {{ stats.companies }}
              </div>
              <div class="text-slate-400 text-lg">Companies</div>
            </div>
            <div class="text-center">
              <div class="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-3">
                {{ stats.activeJobs }}
              </div>
              <div class="text-slate-400 text-lg">Active Jobs</div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-gradient-to-b from-slate-900 to-slate-950 py-20 border-t border-slate-800">
        <div class="container mx-auto px-4 max-w-7xl text-center">
          <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to start your career journey?
          </h2>
          <p class="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of professionals finding their dream jobs
          </p>
          <button
              (click)="onGetStarted()"
              class="px-8 py-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all duration-300 font-bold text-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]">
            Get Started Now
          </button>
        </div>
      </section>
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
    @keyframes pulse {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.2);
      }
    }
    .animate-pulse {
      animation: pulse 8s ease-in-out infinite;
    }

    .jobs-scroll-container {
      mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    }

    .jobs-track {
      animation: scroll-horizontal 30s linear infinite;
      width: fit-content;
    }

    @keyframes scroll-horizontal {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }

    @media (max-width: 768px) {
      .jobs-track {
        animation-duration: 40s;
      }
    }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('jobsContainer') jobsContainer!: ElementRef;
  allJobs: Job[] = [];
  filteredJobs: Job[] = [];
  isLoading = false;
  isScrollingPaused = false;
  stats = {
    activeJobs: 0,
    applicants: 0,
    companies: 0
  };

  filters = {
    title: '',
    location: '',
    workType: '',
    category: '',
    salaryMin: null as number | null,
    salaryMax: null as number | null
  };

  popularCategories = ['Frontend', 'Backend', 'Design', 'Product', 'DevOps'];

  constructor(
      public router: Router,
      private authService: AuthService,
      private jobService: JobService
  ) {}

  ngOnInit() {
    this.loadAllJobs();
    this.loadUserStats();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.resumeScroll();
    }, 100);
  }

  ngOnDestroy() {
  }

  pauseScroll() {
    this.isScrollingPaused = true;
  }

  resumeScroll() {
    this.isScrollingPaused = false;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadAllJobs() {
    this.isLoading = true;
    this.jobService.getJobsByStatus(0).subscribe({
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

  loadUserStats() {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.stats.applicants = users.filter(u => u.role === 2).length;
        this.stats.companies = users.filter(u => u.role === 1).length;
      },
      error: () => {
        this.stats.applicants = 0;
        this.stats.companies = 0;
      }
    });
  }

  getJobBorderColor(category?: string): string {
    if (!category) return 'border-cyan-400';
    const cat = category.toLowerCase();
    if (cat.includes('tech') || cat.includes('it')) return 'border-cyan-400';
    if (cat.includes('design')) return 'border-purple-400';
    if (cat.includes('marketing')) return 'border-pink-400';
    if (cat.includes('sales')) return 'border-green-400';
    return 'border-blue-400';
  }

  getJobBadgeColor(category?: string): string {
    if (!category) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    const cat = category.toLowerCase();
    if (cat.includes('tech') || cat.includes('it')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (cat.includes('design')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (cat.includes('marketing')) return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    if (cat.includes('sales')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  filterJobs() {
    this.filteredJobs = this.allJobs.filter(job => {
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

  filterByCategory(category: string) {
    this.filters.category = category;
    this.filterJobs();
    setTimeout(() => {
      const jobsSection = document.querySelector('section:nth-of-type(3)');
      if (jobsSection) {
        jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
    this.filteredJobs = this.allJobs;
  }

  onGetStarted() {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 1) {
        this.router.navigate(['/company']);
      } else {
        this.router.navigate(['/jobseeker']);
      }
    } else {
      this.router.navigate(['/auth']);
    }
  }
}
