import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge'; // For department badge
import { MatTooltipModule } from '@angular/material/tooltip'; // For progress bar tooltip
import { Router } from '@angular/router'; // Import Router
import { Auth } from '../auth/auth'; // Import Auth Service

import { UserService } from '../services/user.service';
import { UserProfileResponse } from '../shared/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, TimeoutError } from 'rxjs'; // Import throwError and TimeoutError
import { catchError, timeout } from 'rxjs/operators'; // Import catchError and timeout

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule // For tooltips
  ],
  providers: [DatePipe], // Provide DatePipe here if not provided globally
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  userProfile: UserProfileResponse | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private datePipe: DatePipe,
    private authService: Auth, // Inject Auth Service
    private router: Router // Inject Router
  ) { }

  ngOnInit(): void {
    this.userService.getUserProfile().pipe(
      timeout(10000), // Set a timeout of 10 seconds
      catchError((err) => { // Catch errors from timeout or original http call
        if (err instanceof TimeoutError) {
          this.error = 'Yêu cầu tải hồ sơ quá thời gian. Vui lòng kiểm tra kết nối mạng hoặc thử lại.';
          console.error('MyProfileComponent - Timeout Error:', err);
        } else if (err instanceof HttpErrorResponse) {
          this.error = `Lỗi HTTP ${err.status}: ${err.message || 'Không thể tải thông tin hồ sơ.'}`;
          console.error('MyProfileComponent - HTTP Error:', err);
        } else {
          this.error = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
          console.error('MyProfileComponent - Unknown Error in pipe:', err);
        }
        this.isLoading = false;
        console.log('MyProfileComponent catchError - isLoading set to false. error:', this.error);
        return throwError(() => err); // Re-throw for further handling if needed
      })
    ).subscribe({
      next: (data) => {
        console.log('MyProfileComponent - Data received:', data); // Log the received data
        this.userProfile = data;
        this.isLoading = false;
        console.log('MyProfileComponent - After data assignment: isLoading=', this.isLoading, 'userProfile=', this.userProfile); // Log state
      },
      error: (err) => { // This error will now catch the timeout error or other http errors
        // Error message and isLoading already handled in the pipe's catchError
        // This block is primarily for RxJS error handling that might slip past the pipe's catchError,
        // but given the structure, it's mostly redundant for setting error messages here.
        this.isLoading = false;
        console.log('MyProfileComponent - Error block: isLoading=', this.isLoading, 'error=', this.error); // Log state
      }
    });
  }

  logout(): void {
    this.authService.logout(); // Call logout method from AuthService
    this.router.navigate(['/login']); // Redirect user to login page
  }

  getDefaultAvatar(): string {
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=200'; // Using Gravatar as default avatar
  }

  getTranslatedStatus(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Đang thực tập';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'TERMINATED':
        return 'Đã kết thúc';
      default:
        return status;
    }
  }

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'status-in-progress'; // Green
      case 'COMPLETED':
        return 'status-completed'; // Blue
      case 'TERMINATED':
        return 'status-terminated'; // Red
      default:
        return 'status-default'; // Grey or black
    }
  }

  calculateProgress(): number {
    if (!this.userProfile?.startDate || !this.userProfile?.endDate) {
      return 0;
    }
    const { startDate, endDate } = this.userProfile;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (now < start) {
      return 0; // Internship has not started yet
    }
    if (now > end) {
      return 100; // Internship has ended
    }

    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();

    return (elapsedDuration / totalDuration) * 100;
  }

  getDaysRemaining(): { days: number, colorClass: string } {
    if (!this.userProfile?.endDate) {
      return { days: 0, colorClass: '' };
    }
    const endDate = new Date(this.userProfile.endDate);
    const now = new Date();
    // Reset time components to only compare dates
    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let colorClass = '';
    if (diffDays <= 7 && diffDays > 0) {
      colorClass = 'days-remaining-warning'; // Red if 1-7 days left
    } else if (diffDays <= 0) {
      colorClass = 'days-remaining-past'; // Grey if ended
    } else {
      colorClass = 'days-remaining-normal'; // Normal if more than 7 days left
    }

    return { days: diffDays, colorClass: colorClass };
  }

  getFormattedDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'dd/MM/yyyy') || dateString;
  }
}
