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
    // Individual form field errors will handle invalid input
    // and prevent submission if form.invalid remains true.

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
            // Clear any existing errors first if needed, then set custom error on password field
            this.loginForm.get('password')?.setErrors({
              incorrectCredentials:
                'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
            });
          },
        });
      }
    }
  }
}
