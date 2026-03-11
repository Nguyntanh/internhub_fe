import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth'; // Import AuthService

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: Auth,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip if not browser (SSR)
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[JWT] SSR - skipping token');
      return next.handle(request);
    }

    // Lấy token từ localStorage trực tiếp
    const token = localStorage.getItem('jwt_token');
    const isApiUrl = request.url.startsWith('http://localhost:8090/api/');

    console.log(
      '[JWT] Request:',
      request.url.substring(0, 50),
      '| Token exists:',
      !!token,
      '| isApiUrl:',
      isApiUrl,
    );

    if (token && isApiUrl && !request.url.includes('/auth/login')) {
      console.log('[JWT] Adding Authorization header');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request);
  }
}
