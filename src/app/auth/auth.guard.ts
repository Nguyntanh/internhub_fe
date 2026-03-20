// src/app/auth/auth.guard.ts — mở rộng file hiện có

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';
import { RoleService } from './role.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

// Chỉ INTERN được vào
export const internGuard: CanActivateFn = () => {
  const role = inject(RoleService);
  const router = inject(Router);
  if (role.isIntern()) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Không phải INTERN mới được vào
export const nonInternGuard: CanActivateFn = () => {
  const role = inject(RoleService);
  const router = inject(Router);
  if (!role.isIntern()) return true;
  router.navigate(['/my-tasks']);
  return false;
};
