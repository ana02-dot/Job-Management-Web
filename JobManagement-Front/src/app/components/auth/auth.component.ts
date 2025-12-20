import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, UserRegistrationRequest } from '../../services/auth.service';
import { LucideAngularModule, Briefcase, Building2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="h-screen bg-slate-900 flex flex-col overflow-hidden">
      <div class="flex-shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 sm:gap-3 group cursor-pointer" (click)="router.navigate(['/'])">
              <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-8 sm:h-10 w-auto" />
            </div>
            <button
                type="button"
                (click)="router.navigate(['/'])"
                class="text-xs sm:text-sm text-slate-300 hover:text-cyan-400 active:text-cyan-500 flex items-center gap-1 transition-colors">
              <lucide-arrow-left class="w-3 h-3 sm:w-4 sm:h-4"/>
              <span class="hidden sm:inline">Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 max-w-2xl">
          <div class="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-4 sm:p-6 md:p-8">
            <div class="flex flex-col items-center justify-center mb-3 sm:mb-4">
              <img src="/assets/images/stepup-logo.png" alt="StepUp Logo" class="h-12 sm:h-16 w-auto mb-3" />
              <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-center text-white">Welcome to StepUp</h2>
            </div>

            <div class="mb-3 sm:mb-4">
              <div class="flex border-b border-slate-700">
                <button
                    type="button"
                    [class.border-b-2]="authType === 'login'"
                    [class.border-cyan-500]="authType === 'login'"
                    [class.text-cyan-400]="authType === 'login'"
                    [class.text-slate-400]="authType !== 'login'"
                    (click)="switchAuthType('login')"
                    class="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base text-center font-medium transition-colors">
                  Login
                </button>
                <button
                    type="button"
                    [class.border-b-2]="authType === 'signup'"
                    [class.border-cyan-500]="authType === 'signup'"
                    [class.text-cyan-400]="authType === 'signup'"
                    [class.text-slate-400]="authType !== 'signup'"
                    (click)="switchAuthType('signup')"
                    class="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base text-center font-medium transition-colors">
                  Sign Up
                </button>
              </div>
            </div>

            <div *ngIf="errorMessage" class="error-message-container mb-2 sm:mb-3 p-2 sm:p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-xs sm:text-sm flex items-start gap-2">
              <lucide-alert-circle class="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <div class="flex-1 break-words">{{ errorMessage }}</div>
            </div>

            <div *ngIf="successMessage" class="error-message-container mb-2 sm:mb-3 p-2 sm:p-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-xs sm:text-sm break-words">
              {{ successMessage }}
            </div>

            <div *ngIf="authType === 'signup' && password" class="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-slate-900/50 border border-slate-700 rounded text-xs">
              <div class="font-medium text-slate-300 mb-1 sm:mb-1.5">Password Requirements:</div>
              <div class="space-y-0.5 sm:space-y-1">
                <div [class.text-green-400]="hasMinLength()" [class.text-red-400]="!hasMinLength()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasMinLength() ? '✓' : '✗' }}</span>
                  <span class="text-xs">At least 8 characters ({{ password.length }}/8)</span>
                </div>
                <div [class.text-green-400]="hasUppercase()" [class.text-red-400]="!hasUppercase()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasUppercase() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One uppercase letter (A-Z)</span>
                </div>
                <div [class.text-green-400]="hasLowercase()" [class.text-red-400]="!hasLowercase()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasLowercase() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One lowercase letter (a-z)</span>
                </div>
                <div [class.text-green-400]="hasNumber()" [class.text-red-400]="!hasNumber()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasNumber() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One number (0-9)</span>
                </div>
                <div [class.text-green-400]="hasSpecialChar()" [class.text-red-400]="!hasSpecialChar()" class="flex items-center gap-1.5">
                  <span class="w-3 text-xs">{{ hasSpecialChar() ? '✓' : '✗' }}</span>
                  <span class="text-xs">One special character: {{ specialCharacters }}</span>
                </div>
              </div>
            </div>

            <form (ngSubmit)="handleSubmit()" #authForm="ngForm" class="space-y-2.5 sm:space-y-3">
              <div *ngIf="authType === 'signup'" class="space-y-2 sm:space-y-2.5">
                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-300">First Name *</label>
                  <input
                      type="text"
                      [(ngModel)]="signupData.firstName"
                      name="firstName"
                      class="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition"
                      placeholder="John"
                      required
                      minlength="2"
                      maxlength="100"
                      pattern="^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ' -]+$"
                      [class.border-red-500]="isFirstNameInvalid()">
                  <div *ngIf="isFirstNameInvalid()" class="text-red-400 text-xs mt-0.5">
                    First name must be 2-100 characters, letters only
                  </div>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-300">Last Name *</label>
                  <input
                      type="text"
                      [(ngModel)]="signupData.lastName"
                      name="lastName"
                      class="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition"
                      placeholder="Doe"
                      required
                      minlength="2"
                      maxlength="100"
                      pattern="^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ' -]+$"
                      [class.border-red-500]="isLastNameInvalid()">
                  <div *ngIf="isLastNameInvalid()" class="text-red-400 text-xs mt-0.5">
                    Last name must be 2-100 characters, letters only
                  </div>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-300">Phone Number *</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm">+995</span>
                    <input
                        type="tel"
                        [(ngModel)]="phoneNumberDigits"
                        name="phoneNumber"
                        (input)="formatPhoneNumber()"
                        (keydown)="preventInvalidKeys($event)"
                        class="w-full pl-12 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition"
                        placeholder="XXXXXXXXX"
                        maxlength="9"
                        pattern="[0-9]{9}"
                        required>
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">Enter 9 digits (the +995 prefix is added automatically)</div>
                </div>
              </div>

              <div>
                <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-300">Email *</label>
                <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    class="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition"
                    placeholder="your.email@example.com"
                    maxlength="200"
                    required>
              </div>

              <div>
                <label class="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-slate-300">Password *</label>
                <input
                    type="password"
                    [(ngModel)]="password"
                    name="password"
                    class="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition"
                    placeholder="••••••••"
                    required
                    minlength="8"
                    maxlength="100"
                    [class.border-red-500]="authType === 'signup' && isPasswordInvalid()">
                <div *ngIf="authType === 'signup' && isPasswordInvalid()" class="text-red-400 text-xs mt-0.5">
                  Password does not meet requirements
                </div>
              </div>

              <div *ngIf="authType === 'signup'">
                <label class="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-slate-300">I am a: *</label>
                <div class="space-y-1.5 sm:space-y-2">
                  <label
                      [ngClass]="{
                      'border-cyan-500': role === 2,
                      'bg-cyan-500/10': role === 2
                    }"
                      class="flex items-center space-x-2 border border-slate-700 rounded-lg p-2 sm:p-2.5 cursor-pointer hover:bg-slate-700/50 transition-colors bg-slate-900/50">
                    <input
                        type="radio"
                        [(ngModel)]="role"
                        name="role"
                        [value]="2"
                        class="cursor-pointer w-4 h-4 accent-cyan-500">
                    <lucide-briefcase class="w-4 h-4 text-cyan-400 flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm text-white">Job Seeker</div>
                      <div class="text-xs text-slate-400">Looking for opportunities</div>
                    </div>
                  </label>
                  <label
                      [ngClass]="{
                      'border-purple-500': role === 1,
                      'bg-purple-500/10': role === 1
                    }"
                      class="flex items-center space-x-2 border border-slate-700 rounded-lg p-2 sm:p-2.5 cursor-pointer hover:bg-slate-700/50 transition-colors bg-slate-900/50">
                    <input
                        type="radio"
                        [(ngModel)]="role"
                        name="role"
                        [value]="1"
                        class="cursor-pointer w-4 h-4 accent-purple-500">
                    <lucide-building2 class="w-4 h-4 text-purple-400 flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm text-white">Company (HR)</div>
                      <div class="text-xs text-slate-400">Hiring talent</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                  type="submit"
                  [disabled]="isLoading || (authType === 'signup' && isSignupFormInvalid()) || (authType === 'login' && (!email || !password))"
                  class="w-full py-2.5 sm:py-3 px-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 active:bg-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base mt-3 sm:mt-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
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
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="tel"] {
      min-height: 40px;
      box-sizing: border-box;
    }

    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="tel"],
    select,
    textarea {
      font-size: 16px; 
    }

    @media (min-width: 640px) {
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="tel"] {
        font-size: 14px;
      }
    }

    button {
      min-height: 40px;
      touch-action: manipulation; 
    }

    .error-message-container {
      min-height: 0;
    }

    button, a, input, select, textarea, label {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host {
      display: block;
      height: 100%;
    }

    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: rgb(15 23 42); /* slate-900 */
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgb(51 65 85); /* slate-700 */
      border-radius: 3px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: rgb(71 85 105); /* slate-600 */
    }
  `]
})
export class AuthComponent {
  authType: 'login' | 'signup' = 'login';
  role: number = 2; // 2 = Applicant, 1 = HR
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  email = '';
  password = '';

  specialCharacters = '@ $ ! % * ? &';

  signupData: Partial<UserRegistrationRequest> = {
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };

  phoneNumberDigits = '';


  constructor(
      public router: Router,
      private authService: AuthService
  ) {}

  switchAuthType(type: 'login' | 'signup') {
    this.authType = type;
    this.errorMessage = '';
    this.successMessage = '';
    if (type === 'signup') {
      this.phoneNumberDigits = '';
      this.signupData.phoneNumber = '';
    }
  }


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


  isFirstNameInvalid(): boolean {
    const fn = this.signupData.firstName || '';
    return fn.length > 0 && (fn.length < 2 || fn.length > 100 || !/^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ' -]+$/.test(fn));
  }

  isLastNameInvalid(): boolean {
    const ln = this.signupData.lastName || '';
    return ln.length > 0 && (ln.length < 2 || ln.length > 100 || !/^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ' -]+$/.test(ln));
  }

  formatPhoneNumber(): void {
    this.phoneNumberDigits = this.phoneNumberDigits.replace(/\D/g, '');

    if (this.phoneNumberDigits.length > 9) {
      this.phoneNumberDigits = this.phoneNumberDigits.substring(0, 9);
    }

    this.signupData.phoneNumber = '+995' + this.phoneNumberDigits;
  }

  preventInvalidKeys(event: KeyboardEvent): void {
    if ([46, 8, 9, 27, 13, 37, 38, 39, 40].indexOf(event.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true)) {
      return;
    }
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
      event.preventDefault();
    }
  }

  isPhoneNumberInvalid(): boolean {
    return this.phoneNumberDigits.length > 0 && this.phoneNumberDigits.length !== 9;
  }

  isSignupFormInvalid(): boolean {
    return !this.signupData.firstName ||
        !this.signupData.lastName ||
        this.phoneNumberDigits.length !== 9 ||
        !this.email ||
        !this.password ||
        this.isPasswordInvalid() ||
        this.isFirstNameInvalid() ||
        this.isLastNameInvalid() ||
        this.isPhoneNumberInvalid();
  }


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
    if (this.isPasswordInvalid()) {
      this.errorMessage = 'Password does not meet all requirements';
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

    if (this.phoneNumberDigits.length !== 9) {
      this.errorMessage = 'Phone number must be exactly 9 digits';
      this.isLoading = false;
      return;
    }

    this.signupData.phoneNumber = '+995' + this.phoneNumberDigits;

    const registrationRequest: UserRegistrationRequest = {
      firstName: this.signupData.firstName || '',
      lastName: this.signupData.lastName || '',
      phoneNumber: this.signupData.phoneNumber,
      email: this.email,
      password: this.password,
      role: this.role
    };

    console.log('Registration request:', registrationRequest);

    this.authService.register(registrationRequest).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! Logging you in...';
        this.autoLoginAfterSignup();
      },
      error: (error: any) => {
        console.error(' Registration error:', error);

        if (error.error?.errors) {
          const validationErrors = error.error.errors;
          const errorMessages: string[] = [];

          Object.keys(validationErrors).forEach(key => {
            if (key.toLowerCase() !== 'personalnumber') {
              const messages = validationErrors[key];
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else {
                errorMessages.push(messages);
              }
            }
          });

          this.errorMessage = errorMessages.length > 0
              ? errorMessages.join('. ')
              : 'Please check your input and try again.';
        } else {
          this.errorMessage = error.error?.message || error.message || 'Registration failed. Please try again.';
        }

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