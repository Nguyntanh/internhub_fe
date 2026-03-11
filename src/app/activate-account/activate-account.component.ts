import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../auth/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.css'],
})
export class ActivateAccountComponent implements OnInit {
  activationStatus: 'pending' | 'success' | 'failure' = 'pending';
  message: string = 'Activating your account...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.authService.activateAccount(token).subscribe({
          next: () => {
            this.router.navigate(['/login']); // Redirect directly to login on success
          },
          error: (error: HttpErrorResponse) => {
            setTimeout(() => {
              this.activationStatus = 'failure';
              console.error('Account activation failed:', error);
              if (error.status === 404) { // Specifically handle 404
                this.message = 'Activation link is invalid or has already been used.';
              } else if (error.status === 400) {
                this.message = error.error?.message || 'Invalid or expired activation token.';
              } else {
                this.message = 'Failed to activate account. Please try again later.';
              }
            }, 0);
          },
        });
      } else {
        setTimeout(() => {
          this.activationStatus = 'failure';
          this.message = 'Activation token not found in the URL.';
        }, 0);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
