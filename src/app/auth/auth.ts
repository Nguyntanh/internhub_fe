import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError, BehaviorSubject, map, tap } from 'rxjs';
// import { jwtDecode } from 'jwt-decode'; // Uncomment if using jwt-decode library

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'http://localhost:8090/api/auth/login'; // Your backend login API endpoint

  // BehaviorSubject để quản lý trạng thái người dùng hiện tại
  // Ban đầu sẽ kiểm tra localStorage xem đã có token chưa để khôi phục trạng thái
  private currentUserSubject: BehaviorSubject<any | null>;
  public currentUser$: Observable<any | null>;

  constructor(private http: HttpClient) {
    // Khởi tạo currentUserSubject từ token trong localStorage (nếu có)
    const token = localStorage.getItem('jwt_token');
    let user = null;
    if (token) {
      // TODO: Giải mã JWT token để lấy thông tin người dùng thực sự
      // Ví dụ: user = jwtDecode(token);
      user = { token: token }; // Tạm thời lưu trữ token như một phần của user
    }
    this.currentUserSubject = new BehaviorSubject<any | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Getter để lấy giá trị hiện tại của người dùng
  public get currentUserValue(): any | null {
    return this.currentUserSubject.value;
  }

  // Getter để kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    return this.http.post<any>(this.apiUrl, credentials, httpOptions).pipe(
      tap((response: any) => {
        // Sau khi đăng nhập thành công
        if (response && response.token) {
          // Lưu token vào localStorage
          localStorage.setItem('jwt_token', response.token);
          // TODO: Giải mã JWT token để lấy thông tin người dùng thực sự
          // Ví dụ: this.currentUserSubject.next(jwtDecode(response.token));
          this.currentUserSubject.next({ token: response.token }); // Tạm thời cập nhật user với token
        }
      }),
      catchError(this.handleError<any>('login'))
    );
  }

  // Phương thức đăng xuất
  logout(): void {
    // Xóa token khỏi localStorage
    localStorage.removeItem('jwt_token');
    // Cập nhật trạng thái người dùng thành null
    this.currentUserSubject.next(null);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Ghi lỗi ra console
      // Tùy chọn: gửi lỗi đến một cơ sở hạ tầng ghi nhật ký từ xa

      // Cho phép ứng dụng tiếp tục chạy bằng cách trả về một kết quả rỗng.
      return throwError(() => error);
    };
  }
}
