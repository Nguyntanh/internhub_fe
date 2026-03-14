import { Injectable, PLATFORM_ID, inject } from '@angular/core'
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Observable } from 'rxjs'
import { isPlatformBrowser } from '@angular/common'

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private platformId = inject(PLATFORM_ID)

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    let token: string | null = null

    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('jwt_token')
    }

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    }

    return next.handle(req)
  }
}