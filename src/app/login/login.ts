import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../auth/auth'; // Import the Auth service

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  constructor(private authService: Auth, private router: Router) {}

  onSubmit() {
    // Clear previous form-level and control-level API errors on new submission
    this.loginForm.setErrors(null);
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('incorrectCredentials')) {
      passwordControl.setErrors(null);
      passwordControl.updateValueAndValidity();
    }

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (email && password) {
        this.authService.login({ email, password }).subscribe({
          next: (response) => {
            console.log('Login successful', response);
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            console.error('Login failed', error);
            if (error.status === 0) {
              // Set a form-level error for connection issues
              this.loginForm.setErrors({
                connectionLost:
                  'Mất kết nối tới máy chủ. Vui lòng thử lại sau.',
              });
            } else {
              // Set a control-level error for authentication issues
              passwordControl?.setErrors({
                incorrectCredentials:
                  'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
              });
            }
          },
        });
      }
    }
  }
}
