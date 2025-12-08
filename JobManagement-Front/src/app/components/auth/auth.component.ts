import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, UserRegistrationRequest } from '../../services/auth.service';
import { LucideAngularModule, Briefcase, Building2, ArrowLeft, AlertCircle } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <lucide-briefcase class="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
              </div>
              <h1 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Jobs.ge</h1>
            </div>
            <button
                type="button"
                (click)="router.navigate(['/'])"
                class="text-xs sm:text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 flex items-center gap-1 transition-colors">
              <lucide-arrow-left class="w-3 h-3 sm:w-4 sm:h-4"></lucide-arrow-left>
              <span class="hidden sm:inline">Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area - Scrollable -->
      <div class="flex-1 overflow-y-auto">
        <div class="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 max-w-2xl">
          <div class="bg-white rounded-lg shadow-xl border border-slate-200 p-4 sm:p-6 md:p-8">
            <!-- Logo and Title -->
            <div class="flex items-center justify-center mb-3 sm:mb-4">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <lucide-briefcase class="w-6 h-6 sm:w-7 sm:h-7 text-white"/>
              </div>
            </div>
            <h2 class="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center text-slate-900">Welcome to Jobs.ge</h2>

            <!-- Tabs -->
            <div class="mb-3 sm:mb-4">
              <div class="flex border-b">
                <button
                    type="button"
                    [class.border-b-2]="authType === 'login'"
                    [class.border-blue-600]="authType === 'login'"
                    [class.text-blue-600]="authType === 'login'"
                    (click)="switchAuthType('login')"
                    class="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base text-center font-medium transition-colors">
                  Login
                </button>
                <button
                    type="button"
                    [class.border-b-2]="authType === 'signup'"
                    [class.border-blue-600]="authType === 'signup'"
                    [class.text-blue-600]="authType === 'signup'"
                    (click)="switchAuthType('signup')"
                    class="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base text-center font-medium transition-colors">
                  Sign Up
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="error-message-container mb-2 sm:mb-3 p-2 sm:p-2.5 bg-red-100 border border-red-400 text-red-700 rounded text-xs sm:text-sm flex items-start gap-2">
              <lucide-alert-circle class="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <div class="flex-1 break-words">{{ errorMessage }}</div>
            </div>

            <!-- Success Message -->
            <div *ngIf="successMessage" class="error-message-container mb-2 sm:mb-3 p-2 sm:p-2.5 bg-green-100 border border-green-400 text-green-700 rounded text-xs sm:text-sm break-words">
              {{ successMessage }}
            </div>

            <!-- Password Requirements (shown during signup) -->
            <div *ngIf="authType === 'signup' && password" class="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
              <div class="font-medium text-slate-700 mb-1 sm:mb-1.5">Password Requirements:</div>
              <div class="space-y-0.5 sm:space-y-1">
                <div [class.text-green-600]="hasMinLength()" [class.text-red-600]="!hasMinLength()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasMinLength() ? '✓' : '✗' }}</span>
                  <span class="text-xs">At least 8 characters ({{ password.length }}/8)</span>
                </div>
                <div [class.text-green-600]="hasUppercase()" [class.text-red-600]="!hasUppercase()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasUppercase() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One uppercase letter (A-Z)</span>
                </div>
                <div [class.text-green-600]="hasLowercase()" [class.text-red-600]="!hasLowercase()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasLowercase() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One lowercase letter (a-z)</span>
                </div>
                <div [class.text-green-600]="hasNumber()" [class.text-red-600]="!hasNumber()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasNumber() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One number (0-9)</span>
                </div>
                <div [class.text-green-600]="hasSpecialChar()" [class.text-red-600]="!hasSpecialChar()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasSpecialChar() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One special character: {{ specialCharacters }}</span>
                </div>
              </div>
            </div>

            <form (ngSubmit)="handleSubmit()" #authForm="ngForm" class="space-y-2.5 sm:space-y-3">
              <!-- Signup fields -->
              <div *ngIf="authType === 'signup'" class="space-y-2 sm:space-y-2.5">
                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-700">Personal Number (11 digits) *</label>
                  <input
                      type="text"
                      [(ngModel)]="signupData.personalNumber"
                      name="personalNumber"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="12345678901"
                      required
                      maxlength="11"
                      minlength="11"
                      pattern="[0-9]{11}"
                      [class.border-red-500]="isPersonalNumberInvalid()">
                  <div *ngIf="isPersonalNumberInvalid()" class="text-red-600 text-xs mt-0.5">
                    Personal number must be exactly 11 digits
                  </div>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-700">First Name *</label>
                  <input
                      type="text"
                      [(ngModel)]="signupData.firstName"
                      name="firstName"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="John"
                      required
                      minlength="2"
                      maxlength="100"
                      pattern="^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$"
                      [class.border-red-500]="isFirstNameInvalid()">
                  <div *ngIf="isFirstNameInvalid()" class="text-red-600 text-xs mt-0.5">
                    First name must be 2-100 characters, letters only
                  </div>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-700">Last Name *</label>
                  <input
                      type="text"
                      [(ngModel)]="signupData.lastName"
                      name="lastName"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Doe"
                      required
                      minlength="2"
                      maxlength="100"
                      pattern="^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$"
                      [class.border-red-500]="isLastNameInvalid()">
                  <div *ngIf="isLastNameInvalid()" class="text-red-600 text-xs mt-0.5">
                    Last name must be 2-100 characters, letters only
                  </div>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-700">Phone Number (optional)</label>
                  <input
                      type="tel"
                      [(ngModel)]="signupData.phoneNumber"
                      name="phoneNumber"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="+995 555 123 456"
                      maxlength="50"
                      [class.border-red-500]="isPhoneNumberInvalid()">
                  <div *ngIf="isPhoneNumberInvalid()" class="text-red-600 text-xs mt-0.5">
                    Phone number cannot exceed 50 characters
                  </div>
                </div>
              </div>

              <!-- Common fields -->
              <div>
                <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-700">Email *</label>
                <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="your.email@example.com"
                    maxlength="200"
                    required>
              </div>

              <div>
                <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-700">Password *</label>
                <input
                    type="password"
                    [(ngModel)]="password"
                    name="password"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="••••••••"
                    required
                    minlength="8"
                    maxlength="100"
                    [class.border-red-500]="authType === 'signup' && isPasswordInvalid()">
                <div *ngIf="authType === 'signup' && isPasswordInvalid()" class="text-red-600 text-xs mt-0.5">
                  Password does not meet requirements
                </div>
              </div>

              <div *ngIf="authType === 'signup'">
                <label class="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-slate-700">I am a: *</label>
                <div class="space-y-1.5 sm:space-y-2">
                  <label
                      class="flex items-center space-x-2 border border-slate-300 rounded-lg p-2 sm:p-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                      [class.border-blue-600]="role === 2"
                      [class.bg-blue-50]="role === 2">
                    <input
                        type="radio"
                        [(ngModel)]="role"
                        name="role"
                        [value]="2"
                        class="cursor-pointer w-4 h-4">
                    <lucide-briefcase class="w-4 h-4 text-blue-600 flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm">Job Seeker</div>
                      <div class="text-xs text-slate-500">Looking for opportunities</div>
                    </div>
                  </label>
                  <label
                      class="flex items-center space-x-2 border border-slate-300 rounded-lg p-2 sm:p-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                      [class.border-purple-600]="role === 1"
                      [class.bg-purple-50]="role === 1">
                    <input
                        type="radio"
                        [(ngModel)]="role"
                        name="role"
                        [value]="1"
                        class="cursor-pointer w-4 h-4">
                    <lucide-building2 class="w-4 h-4 text-purple-600 flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm">Company (HR)</div>
                      <div class="text-xs text-slate-500">Hiring talent</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                  type="submit"
                  [disabled]="isLoading || !authForm.form.valid || (authType === 'signup' && isPasswordInvalid())"
                  class="w-full py-2.5 sm:py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base mt-3 sm:mt-4">
                <span *ngIf="!isLoading">{{ authType === 'login' ? 'Login' : 'Sign Up' }}</span>
                <span *ngIf="isLoading">Loading...</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Ensure consistent sizing and prevent layout shifts */
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="tel"] {
      min-height: 40px;
      box-sizing: border-box;
    }

    /* Prevent text size adjustment on iOS */
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="tel"],
    select,
    textarea {
      font-size: 16px; /* Prevents zoom on iOS */
    }

    @media (min-width: 640px) {
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="tel"] {
        font-size: 14px;
      }
    }

    /* Ensure buttons have proper touch targets */
    button {
      min-height: 40px;
      touch-action: manipulation; /* Prevents double-tap zoom */
    }

    /* Prevent layout shift on error messages */
    .error-message-container {
      min-height: 0;
    }

    /* Smooth transitions */
    * {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Ensure full height layout */
    :host {
      display: block;
      height: 100%;
    }

    /* Custom scrollbar for content area */
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class AuthComponent {
  authType: 'login' | 'signup' = 'login';
  role: number = 2; // 2 = Applicant, 1 = HR
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Unified fields
  email = '';
  password = '';

  // Display string for special characters
  specialCharacters = '@ $ ! % * ? &';

  signupData: Partial<UserRegistrationRequest> = {
    personalNumber: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };

  constructor(
      public router: Router,
      private authService: AuthService
  ) {}

  switchAuthType(type: 'login' | 'signup') {
    this.authType = type;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ===== PASSWORD VALIDATION HELPERS =====

  hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.password);
  }

  hasNumber(): boolean {
    return /\d/.test(this.password);
  }

  hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.password);
  }

  isPasswordInvalid(): boolean {
    if (this.password.length === 0) return false;

    return !(this.hasMinLength() && this.hasUppercase() && this.hasLowercase() && this.hasNumber() && this.hasSpecialChar());
  }

  // ===== FIELD VALIDATION HELPERS =====

  isPersonalNumberInvalid(): boolean {
    const pn = this.signupData.personalNumber || '';
    return pn.length > 0 && (pn.length !== 11 || !/^\d{11}$/.test(pn));
  }

  isFirstNameInvalid(): boolean {
    const fn = this.signupData.firstName || '';
    return fn.length > 0 && (fn.length < 2 || fn.length > 100 || !/^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$/.test(fn));
  }

  isLastNameInvalid(): boolean {
    const ln = this.signupData.lastName || '';
    return ln.length > 0 && (ln.length < 2 || ln.length > 100 || !/^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$/.test(ln));
  }

  isPhoneNumberInvalid(): boolean {
    const pn = this.signupData.phoneNumber || '';
    return pn.length > 50;
  }

  // ===== FORM SUBMISSION =====

  handleSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (this.authType === 'login') {
      this.handleLogin();
    } else {
      this.handleSignup();
    }
  }

  private handleLogin() {
    const loginRequest: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login successful, navigating...');
        // Wait a bit for user info to be fetched, then navigate
        setTimeout(() => {
          this.navigateBasedOnRole();
          this.isLoading = false;
        }, 500);
      },
      error: (error: any) => {
        console.error('Login error:', error);
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
        this.isLoading = false;
      }
    });
  }

  private handleSignup() {
    // Final validation before submission
    if (this.isPasswordInvalid()) {
      this.errorMessage = 'Password does not meet all requirements';
      this.isLoading = false;
      return;
    }

    if (this.isPersonalNumberInvalid()) {
      this.errorMessage = 'Personal number must be exactly 11 digits';
      this.isLoading = false;
      return;
    }

    if (this.isFirstNameInvalid()) {
      this.errorMessage = 'First name is invalid';
      this.isLoading = false;
      return;
    }

    if (this.isLastNameInvalid()) {
      this.errorMessage = 'Last name is invalid';
      this.isLoading = false;
      return;
    }

    if (this.isPhoneNumberInvalid()) {
      this.errorMessage = 'Phone number cannot exceed 50 characters';
      this.isLoading = false;
      return;
    }

    const registrationRequest: UserRegistrationRequest = {
      personalNumber: this.signupData.personalNumber || '',
      firstName: this.signupData.firstName || '',
      lastName: this.signupData.lastName || '',
      phoneNumber: this.signupData.phoneNumber || '',
      email: this.email,
      password: this.password,
      role: this.role
    };

    console.log('✅ Registration request:', registrationRequest);

    this.authService.register(registrationRequest).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! Logging you in...';
        // Auto-login after successful registration
        this.autoLoginAfterSignup();
      },
      error: (error: any) => {
        console.error('❌ Registration error:', error);
        this.errorMessage = error.error?.message || error.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private autoLoginAfterSignup() {
    const loginRequest: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        setTimeout(() => {
          this.navigateBasedOnRole();
          this.isLoading = false;
        }, 500);
      },
      error: () => {
        this.successMessage = 'Registration successful! Please login.';
        this.authType = 'login';
        this.isLoading = false;
      }
    });
  }

  private navigateBasedOnRole() {
    const user = this.authService.getCurrentUser();
    console.log('Navigating for user:', user);

    if (user?.role === 1) {
      console.log('Navigating to /company');
      this.router.navigate(['/company']);
    } else {
      console.log('Navigating to /jobseeker');
      this.router.navigate(['/jobseeker']);
    }
  }
}