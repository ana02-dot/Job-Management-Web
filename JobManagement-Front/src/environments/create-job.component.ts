
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JobService, CreateJobRequest } from './job.service';

@Component({
    selector: 'app-create-job',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="create-job-container">
      <h2>Create New Job</h2>
      
      <form [formGroup]="jobForm" (ngSubmit)="onSubmit()">
        
        <div class="form-group">
          <label for="title">Job Title *</label>
          <input 
            id="title" 
            type="text" 
            formControlName="title"
            placeholder="e.g. Senior Software Developer"
            [class.error]="jobForm.get('title')?.invalid && jobForm.get('title')?.touched">
          <div class="error-message" 
               *ngIf="jobForm.get('title')?.invalid && jobForm.get('title')?.touched">
            <span *ngIf="jobForm.get('title')?.errors?.['required']">Title is required</span>
            <span *ngIf="jobForm.get('title')?.errors?.['maxlength']">Title must be less than 200 characters</span>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <textarea 
            id="description" 
            formControlName="description"
            rows="4"
            placeholder="Describe the job role and responsibilities..."
            [class.error]="jobForm.get('description')?.invalid && jobForm.get('description')?.touched">
          </textarea>
          <div class="error-message" 
               *ngIf="jobForm.get('description')?.invalid && jobForm.get('description')?.touched">
            Description is required
          </div>
        </div>

        <div class="form-group">
          <label for="requirements">Requirements *</label>
          <textarea 
            id="requirements" 
            formControlName="requirements"
            rows="4"
            placeholder="List the job requirements..."
            [class.error]="jobForm.get('requirements')?.invalid && jobForm.get('requirements')?.touched">
          </textarea>
          <div class="error-message" 
               *ngIf="jobForm.get('requirements')?.invalid && jobForm.get('requirements')?.touched">
            Requirements are required
          </div>
        </div>

        <div class="form-group">
          <label for="location">Location *</label>
          <input 
            id="location" 
            type="text" 
            formControlName="location"
            placeholder="e.g. Tbilisi, Georgia"
            [class.error]="jobForm.get('location')?.invalid && jobForm.get('location')?.touched">
          <div class="error-message" 
               *ngIf="jobForm.get('location')?.invalid && jobForm.get('location')?.touched">
            <span *ngIf="jobForm.get('location')?.errors?.['required']">Location is required</span>
            <span *ngIf="jobForm.get('location')?.errors?.['maxlength']">Location must be less than 200 characters</span>
          </div>
        </div>

        <div class="form-group">
          <label for="applicationDeadline">Application Deadline *</label>
          <input 
            id="applicationDeadline" 
            type="date" 
            formControlName="applicationDeadline"
            [min]="tomorrow"
            [class.error]="jobForm.get('applicationDeadline')?.invalid && jobForm.get('applicationDeadline')?.touched">
          <div class="error-message" 
               *ngIf="jobForm.get('applicationDeadline')?.invalid && jobForm.get('applicationDeadline')?.touched">
            <span *ngIf="jobForm.get('applicationDeadline')?.errors?.['required']">Deadline is required</span>
            <span *ngIf="jobForm.get('applicationDeadline')?.errors?.['futureDate']">Deadline must be in the future</span>
          </div>
        </div>

        <div class="form-group">
          <label for="salary">Salary (Optional)</label>
          <input 
            id="salary" 
            type="number" 
            formControlName="salary"
            placeholder="e.g. 50000"
            min="0"
            [class.error]="jobForm.get('salary')?.invalid && jobForm.get('salary')?.touched">
          <div class="error-message" 
               *ngIf="jobForm.get('salary')?.invalid && jobForm.get('salary')?.touched">
            Salary must be a positive number
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" 
                  [disabled]="jobForm.invalid || isSubmitting"
                  class="btn-primary">
            {{ isSubmitting ? 'Creating...' : 'Create Job' }}
          </button>
          <button type="button" 
                  (click)="onCancel()"
                  class="btn-secondary">
            Cancel
          </button>
        </div>

        <div class="error-alert" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <div class="success-alert" *ngIf="successMessage">
          {{ successMessage }}
        </div>

      </form>
    </div>
  `,
    styles: [`
    .create-job-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    input, textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    input.error, textarea.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .form-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-primary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .error-alert {
      background-color: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 4px;
      margin-top: 20px;
    }

    .success-alert {
      background-color: #d4edda;
      color: #155724;
      padding: 12px;
      border-radius: 4px;
      margin-top: 20px;
    }
  `]
})
export class CreateJobComponent {
    jobForm: FormGroup;
    isSubmitting = false;
    errorMessage = '';
    successMessage = '';
    tomorrow: string;

    constructor(
        private fb: FormBuilder,
        private jobService: JobService
    ) {
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.tomorrow = tomorrow.toISOString().split('T')[0];

        // Initialize form
        this.jobForm = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(200)]],
            description: ['', Validators.required],
            requirements: ['', Validators.required],
            location: ['', [Validators.required, Validators.maxLength(200)]],
            applicationDeadline: ['', [Validators.required, this.futureDateValidator]],
            salary: [null, [Validators.min(0)]]
        });
    }

    // Custom validator for future date
    futureDateValidator(control: any) {
        if (!control.value) return null;

        const selectedDate = new Date(control.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return selectedDate > today ? null : { futureDate: true };
    }

    onSubmit() {
        if (this.jobForm.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.jobForm.controls).forEach(key => {
                this.jobForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';
        this.successMessage = '';

        // Prepare job data
        const jobData: CreateJobRequest = {
            title: this.jobForm.value.title.trim(),
            description: this.jobForm.value.description.trim(),
            requirements: this.jobForm.value.requirements.trim(),
            location: this.jobForm.value.location.trim(),
            applicationDeadline: new Date(this.jobForm.value.applicationDeadline).toISOString(),
            salary: this.jobForm.value.salary || undefined
        };

        console.log('Submitting job:', jobData);

        this.jobService.createJob(jobData).subscribe({
            next: (jobId) => {
                console.log('Job created successfully with ID:', jobId);
                this.successMessage = `Job created successfully! Job ID: ${jobId}`;
                this.jobForm.reset();
                this.isSubmitting = false;

                // Navigate or perform other actions here
                setTimeout(() => {
                    this.successMessage = '';
                }, 5000);
            },
            error: (error) => {
                console.error('Failed to create job:', error);
                this.isSubmitting = false;

                // Handle different error types
                if (error.status === 400) {
                    // Validation error
                    if (error.error.errors) {
                        const errors = Object.values(error.error.errors).flat();
                        this.errorMessage = `Validation failed: ${errors.join(', ')}`;
                    } else if (error.error.message) {
                        this.errorMessage = error.error.message;
                    } else {
                        this.errorMessage = 'Validation failed. Please check all fields.';
                    }
                } else if (error.status === 401) {
                    this.errorMessage = 'Unauthorized. Please login again.';
                    // Optionally redirect to login
                } else if (error.status === 403) {
                    this.errorMessage = 'You do not have permission to create jobs. Only HR and Admin users can create jobs.';
                } else if (error.status === 500) {
                    this.errorMessage = 'Server error. Please try again later or contact support.';
                } else {
                    this.errorMessage = `Error: ${error.message}`;
                }
            }
        });
    }

    onCancel() {
        this.jobForm.reset();
        this.errorMessage = '';
        this.successMessage = '';
        // Navigate back or perform other actions
    }
}