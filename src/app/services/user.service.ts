import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, BehaviorSubject } from 'rxjs';
import { UserProfileResponse } from '../shared/models/user.model';
import { BASE_API_URL } from '../api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseApiUrl = `${BASE_API_URL}/user`; // Base URL for user-related APIs

  // Default avatar for consistency across components
  public getDefaultAvatar(): string {
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=200';
  }

  // BehaviorSubject to share current user avatar across components
  private _userAvatarSource = new BehaviorSubject<string>(this.getDefaultAvatar());
  currentUserAvatar$ = this._userAvatarSource.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    // In a real application, you would get the JWT token from a service (e.g., AuthService)
    // and include it in the Authorization header.
    // Assuming JwtInterceptor is handling this automatically for now.
    // For multipart/form-data, do NOT manually set Content-Type; the browser will handle it.
    return new HttpHeaders({
      // 'Content-Type': 'application/json', // Not needed for FormData
      // 'Authorization': `Bearer ${yourAuthService.getToken()}` // Handled by interceptor
    });
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http
      .get<UserProfileResponse>(`${this.baseApiUrl}/profile`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError<UserProfileResponse>('getUserProfile')));
  }

  // New method to upload avatar
  uploadAvatar(formData: FormData): Observable<{ newAvatarUrl: string }> {
    // HttpHeaders are intentionally left minimal here.
    // The browser will set the correct 'Content-Type: multipart/form-data' with boundary.
    // The JWT Interceptor should add the Authorization header.
    return this.http
      .patch<{ newAvatarUrl: string }>(`${this.baseApiUrl}/profile/avatar`, formData)
      .pipe(catchError(this.handleError<{ newAvatarUrl: string }>('uploadAvatar')));
  }

  // Method to update the avatar URL across components
  updateUserAvatar(avatarUrl: string) {
    this._userAvatarSource.next(avatarUrl);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Log to console for debugging

      // Re-throw the error for component to handle
      return throwError(() => error);
    };
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_API_URL}/admin/roles`);
  }

  // 2. API lấy người dùng theo roleId động
  getUsersByRoleId(roleId: number, page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('roleId', roleId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(USERS_ENDPOINT, { params });
  }

  // 3. Giữ tên hàm getInterns nhưng cho phép truyền roleId động từ component
  getInterns(roleId: number): Observable<any> {
    return this.getUsersByRoleId(roleId);
  }
}
