import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth'; // Import AuthService
import { tap } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (authService.isLoggedIn()) {
    return true; // Cho phép truy cập route
  } else {
    // Nếu chưa đăng nhập, điều hướng về trang login
    router.navigate(['/login']);
    return false; // Không cho phép truy cập route
  }
};
