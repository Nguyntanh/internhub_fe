import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { UserProfileResponse } from '../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseApiUrl = 'http://localhost:8090/api/user'; // Base URL for user-related APIs

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    // In a real application, you would get the JWT token from a service (e.g., AuthService)
    // and include it in the Authorization header.
    // Assuming JwtInterceptor is handling this automatically for now.
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${yourAuthService.getToken()}`
    });
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseApiUrl}/profile`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError<UserProfileResponse>('getUserProfile'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Log to console for debugging

      // Re-throw the error for component to handle
      return throwError(() => error);
    };
  }
}
