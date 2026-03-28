import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnInit, OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../auth/auth'; // Import the Auth service
import { UserService } from '../services/user.service'; // Import UserService
import { Subject, takeUntil } from 'rxjs'; // Import Subject, takeUntil

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit, OnDestroy { // Implement OnInit, OnDestroy
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  private destroy$ = new Subject<void>(); // Subject để quản lý việc hủy đăng ký
  private backendAssetBaseUrl: string = 'http://localhost:8090'; // Base URL for backend assets

  constructor(private authService: Auth, private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    // // Nếu người dùng đã đăng nhập, chuyển hướng đến trang dashboard (Tạm thời tắt để debug)
    // this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
    //   if (user) {
    //     this.router.navigate(['/dashboard']);
    //   }
    // });
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Gửi tín hiệu hủy đăng ký
    this.destroy$.complete(); // Hoàn thành Subject
  }

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
            // AuthService đã tự động lưu token và cập nhật trạng thái người dùng

            // Fetch user profile to get the avatar and update UserService
            this.userService.getUserProfile().subscribe({
              next: (profileData) => {
                let avatarUrl = profileData.avatar;
                if (avatarUrl && avatarUrl.startsWith('/')) {
                  avatarUrl = this.backendAssetBaseUrl + avatarUrl;
                }
                console.log('LoginComponent: Fetched user profile, updating UserService avatar with:', avatarUrl);
                this.userService.updateUserAvatar(avatarUrl || this.userService.getDefaultAvatar());
                console.log('Attempting to navigate to /dashboard...');
                this.router.navigate(['/dashboard']);
              },
              error: (profileError) => {
                console.error('Login successful but failed to fetch user profile for avatar sync', profileError);
                // Even if profile fetch fails, still navigate to dashboard
                this.router.navigate(['/dashboard']);
              }
            });
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
