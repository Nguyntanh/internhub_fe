import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'http://localhost:8090/api/auth/login'; // Your backend login API endpoint

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    return this.http.post<any>(this.apiUrl, credentials, httpOptions).pipe(
      catchError(this.handleError<any>('login'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Log the error to console
      // Optionally, send the error to a remote logging infrastructure

      // Let the app keep running by returning an empty result.
      return throwError(() => error);
    };
  }
}
