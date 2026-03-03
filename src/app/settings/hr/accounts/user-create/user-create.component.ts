import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Auth } from '../../../../auth/auth'; // Adjust path as needed
import { UserCreationRequest, ErrorDetails } from '../../../../shared/models/user.model'; // Adjust path as needed
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css'], // Assuming a CSS file will be created
})
export class UserCreateComponent implements OnInit {
  userForm!: FormGroup;
  roles = [
    { id: 'admin', name: 'Admin' },
    { id: 'user', name: 'User' },
    { id: 'intern', name: 'Intern' },
  ];
  departments = [
    { id: 'hr', name: 'Human Resources' },
    { id: 'it', name: 'Information Technology' },
    { id: 'sales', name: 'Sales' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      roleId: ['', [Validators.required]],
      departmentId: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const userData: UserCreationRequest = this.userForm.value;
      this.authService.createUser(userData).subscribe({
        next: (response) => {
          this.snackBar.open('User created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/settings/hr/accounts']); // Navigate back to accounts list
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error creating user:', error);
          let errorMessage = 'Failed to create user. Please try again.';

          if (error.error && typeof error.error === 'object' && 'message' in error.error) {
            const errorDetails: ErrorDetails = error.error as ErrorDetails;
            if (error.status === 409) { // Conflict - likely duplicate email
                errorMessage = `Error: ${errorDetails.message || 'Email already exists.'}`;
            } else if (error.status === 400 || error.status === 403) {
                errorMessage = `Error: ${errorDetails.message || 'Invalid input or forbidden.'}`;
            } else {
                errorMessage = `Error: ${errorDetails.message || 'Unknown error.'}`;
            }
          } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
          }
          this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        },
      });
    } else {
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', { duration: 3000 });
    }
  }

  // Helper for form validation messages
  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);

    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters.`;
    }
    if (control?.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters.`;
    }
    if (control?.hasError('email')) {
      return 'Not a valid email.';
    }
    if (control?.hasError('pattern')) {
      return 'Not a valid phone number (10-15 digits).';
    }
    return '';
  }
}
