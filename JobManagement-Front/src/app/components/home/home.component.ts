import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService, Job } from '../../services/job.service';
import { LucideAngularModule, Briefcase, MapPin, Clock, ArrowRight, Building2, Users, TrendingUp } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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
              class="text-lg px-8 py-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Get Started
              <lucide-arrow-right class="inline-block ml-2 w-5 h-5" />
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-briefcase class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">{{ stats[0].value }}</div>
              <div class="text-slate-600 text-sm">{{ stats[0].label }}</div>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-building2 class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">{{ stats[1].value }}</div>
              <div class="text-slate-600 text-sm">{{ stats[1].label }}</div>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-users class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">{{ stats[2].value }}</div>
              <div class="text-slate-600 text-sm">{{ stats[2].label }}</div>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <lucide-trending-up class="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div class="text-3xl mb-2 font-bold text-slate-900">{{ stats[3].value }}</div>
              <div class="text-slate-600 text-sm">{{ stats[3].label }}</div>
            </div>
          </div>

          <!-- Featured Jobs Section -->
          <div *ngIf="featuredJobs.length > 0" class="mt-16">
            <div class="mb-8">
              <h2 class="text-3xl font-bold mb-2 text-slate-900">Featured Jobs</h2>
              <p class="text-slate-600">Explore our top job opportunities</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let job of featuredJobs" 
                   (click)="onGetStarted()"
                   class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border border-slate-200 hover:border-blue-300">
                <h3 class="text-xl font-semibold mb-2 text-slate-900">{{ job.title }}</h3>
                <p class="text-slate-600 mb-4 line-clamp-2">{{ job.description }}</p>
                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-2 text-slate-600 text-sm">
                    <lucide-map-pin class="w-4 h-4" />
                    <span>{{ job.location }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600 text-sm">
                    <lucide-briefcase class="w-4 h-4" />
                    <span>{{ job.employmentType }}</span>
                  </div>
                  <div *ngIf="job.salary" class="flex items-center gap-2 text-slate-600 text-sm">
                    <lucide-clock class="w-4 h-4" />
                    <span>{{ job.salary }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {{ job.salary || 'Competitive' }}
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
  featuredJobs: Job[] = [];
  stats = [
    { label: 'Active Jobs', value: '1,250+' },
    { label: 'Companies', value: '350+' },
    { label: 'Job Seekers', value: '15,000+' },
    { label: 'Success Rate', value: '87%' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.loadFeaturedJobs();
  }

  loadFeaturedJobs() {
    this.jobService.getJobsByStatus(1).subscribe({
      next: (jobs: Job[]) => {
        this.featuredJobs = jobs.slice(0, 3); // Show first 3 published jobs
      },
      error: () => {
        // If API fails, show empty or handle gracefully
        this.featuredJobs = [];
      }
    });
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

