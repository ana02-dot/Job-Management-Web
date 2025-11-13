import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, UserRegistrationRequest } from '../../services/auth.service';
import { LucideAngularModule, Briefcase, Building2, ArrowLeft, Mail, Lock, User, Phone, Hash } from 'lucide-angular';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-slate-200">
        <div class="flex items-center justify-center mb-6">
          <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <lucide-briefcase class="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 class="text-2xl font-bold mb-6 text-center text-slate-900">Welcome to Jobs.ge</h1>

        <div class="mb-6">
          <div class="flex border-b">
            <button
              [class.border-b-2]="authType === 'login'"
              [class.border-blue-600]="authType === 'login'"
              [class.text-blue-600]="authType === 'login'"
              (click)="authType = 'login'"
              class="flex-1 py-2 px-4 text-center font-medium transition">
              Login
            </button>
            <button
              [class.border-b-2]="authType === 'signup'"
              [class.border-blue-600]="authType === 'signup'"
              [class.text-blue-600]="authType === 'signup'"
              (click)="authType = 'signup'"
              class="flex-1 py-2 px-4 text-center font-medium transition">
              Sign Up
            </button>
          </div>
        </div>

        <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="handleSubmit()" class="space-y-4">
          <!-- Signup fields -->
          <div *ngIf="authType === 'signup'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Personal Number (11 digits)</label>
              <input
                type="text"
                [(ngModel)]="signupData.personalNumber"
                name="personalNumber"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345678901"
                required
                maxlength="11"
                pattern="[0-9]{11}">
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                [(ngModel)]="signupData.firstName"
                name="firstName"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
                required>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                [(ngModel)]="signupData.lastName"
                name="lastName"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
                required>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                [(ngModel)]="signupData.phoneNumber"
                name="phoneNumber"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+995 555 123 456">
            </div>
          </div>

          <!-- Common fields -->
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              [(ngModel)]="formData.email"
              name="email"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
              required>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              [(ngModel)]="formData.password"
              name="password"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">I am a:</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  [(ngModel)]="role"
                  name="role"
                  [value]="2"
                  class="cursor-pointer">
                <lucide-briefcase class="w-5 h-5 text-blue-600" />
                <div class="flex-1">
                  <div class="font-medium">Job Seeker</div>
                  <div class="text-sm text-slate-500">Looking for opportunities</div>
                </div>
              </label>
              <label class="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  [(ngModel)]="role"
                  name="role"
                  [value]="1"
                  class="cursor-pointer">
                <lucide-building2 class="w-5 h-5 text-purple-600" />
                <div class="flex-1">
                  <div class="font-medium">Company (HR)</div>
                  <div class="text-sm text-slate-500">Hiring talent</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="isLoading"
            class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            <span *ngIf="!isLoading">{{ authType === 'login' ? 'Login' : 'Sign Up' }}</span>
            <span *ngIf="isLoading">Loading...</span>
          </button>
        </form>

        <div class="mt-4 text-center">
          <button
            (click)="router.navigate(['/'])"
            class="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
            <lucide-arrow-left class="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AuthComponent {
  authType: 'login' | 'signup' = 'login';
  role: number = 2; // 2 = Applicant, 1 = HR
  isLoading = false;
  errorMessage = '';

  formData = {
    email: '',
    password: ''
  };

  signupData: UserRegistrationRequest = {
    personalNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 2
  };

  constructor(
    public router: Router,
    private authService: AuthService
  ) {}

  handleSubmit() {
    this.errorMessage = '';
    this.isLoading = true;

    if (this.authType === 'login') {
      const loginRequest: LoginRequest = {
        email: this.formData.email,
        password: this.formData.password
      };

      this.authService.login(loginRequest).subscribe({
        next: (response: any) => {
          // Navigate based on role
          const user = this.authService.getCurrentUser();
          if (user) {
            if (user.role === 1) { // HR
              this.router.navigate(['/company']);
            } else {
              this.router.navigate(['/jobseeker']);
            }
          } else {
            this.router.navigate(['/jobseeker']);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
          this.isLoading = false;
        }
      });
    } else {
      // Signup
      const registrationRequest: UserRegistrationRequest = {
        ...this.signupData,
        email: this.formData.email,
        password: this.formData.password,
        role: this.role
      };

      this.authService.register(registrationRequest).subscribe({
        next: (response: any) => {
          // After successful registration, automatically login
          const loginRequest: LoginRequest = {
            email: this.formData.email,
            password: this.formData.password
          };

          this.authService.login(loginRequest).subscribe({
            next: () => {
              const user = this.authService.getCurrentUser();
              if (user) {
                if (user.role === 1) {
                  this.router.navigate(['/company']);
                } else {
                  this.router.navigate(['/jobseeker']);
                }
              }
              this.isLoading = false;
            },
            error: () => {
              this.errorMessage = 'Registration successful! Please login.';
              this.authType = 'login';
              this.isLoading = false;
            }
          });
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}

