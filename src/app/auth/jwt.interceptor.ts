import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth'; // Import AuthService

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: Auth) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Lấy token từ AuthService
    const currentUser = this.authService.currentUserValue;
    const isLoggedIn = currentUser && currentUser.token;
    const isApiUrl = request.url.startsWith('http://localhost:8090/api/');

    // Debug logging
    console.log('[JwtInterceptor] Request URL:', request.url);
    console.log('[JwtInterceptor] Is API URL:', isApiUrl);
    console.log('[JwtInterceptor] Is Logged In:', isLoggedIn);
    console.log('[JwtInterceptor] Current User:', currentUser);

    if (isLoggedIn && isApiUrl && !request.url.includes('/auth/login')) {
      console.log('[JwtInterceptor] Adding Authorization header with token');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });
    } else {
      console.log('[JwtInterceptor] NOT adding token. Conditions:', {
        isLoggedIn,
        isApiUrl,
        isLoginUrl: request.url.includes('/auth/login'),
      });
    }

    return next.handle(request);
  }
}
