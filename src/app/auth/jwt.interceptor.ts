import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth'; // Import AuthService

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: Auth) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Lấy token từ AuthService
    const currentUser = this.authService.currentUserValue;
    const isLoggedIn = currentUser && currentUser.token;
    const isApiUrl = request.url.startsWith('http://localhost:8090/api/'); // Giả định tất cả các API call đến backend đều bắt đầu với đường dẫn này

    // Kiểm tra nếu người dùng đã đăng nhập và yêu cầu không phải là đến trang login
    // và request là đến API backend
    if (isLoggedIn && isApiUrl && !request.url.includes('/auth/login')) {
      // Clone request để thêm header Authorization
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
    }

    return next.handle(request);
  }
}
