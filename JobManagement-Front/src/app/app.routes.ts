import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'jobseeker',
    loadComponent: () => import('./components/job-seeker-dashboard/job-seeker-dashboard.component').then(m => m.JobSeekerDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'company',
    loadComponent: () => import('./components/company-dashboard/company-dashboard.component').then(m => m.CompanyDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
