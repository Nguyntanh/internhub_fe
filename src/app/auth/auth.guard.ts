import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Auth } from './auth'; // Import AuthService
import { PermissionService } from '../services/permission.service'; // Import PermissionService
import { map, switchMap, take } from 'rxjs';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  // 1. Kiểm tra xem người dùng đã đăng nhập chưa
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Nếu đã đăng nhập, kiểm tra quyền
  const requiredPermission = route.data['requiredPermission'];

  if (requiredPermission) {
    // Tải quyền nếu chưa có hoặc đảm bảo đã tải
    return permissionService.getPermissions().pipe(
      take(1), // Lấy giá trị hiện tại và hoàn thành
      switchMap(() => {
        // Sau khi đảm bảo quyền đã được tải, kiểm tra quyền cụ thể
        return permissionService.hasPermission(requiredPermission.functionCode, requiredPermission.permissionType).pipe(
          take(1), // Lấy giá trị hiện tại và hoàn thành
          map(hasPerm => {
            if (hasPerm) {
              return true;
            } else {
              // Nếu không có quyền, điều hướng về dashboard hoặc trang báo lỗi
              console.warn(`User does not have required permission for ${requiredPermission.functionCode}:${requiredPermission.permissionType}`);
              router.navigate(['/dashboard']); // Hoặc một trang "Unauthorized"
              return false;
            }
          })
        );
      })
    );
  }

  // Nếu không có requiredPermission nào được định nghĩa trong route.data, cho phép truy cập
  return true;
};
