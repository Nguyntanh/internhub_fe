import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private roleSubject = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRole();
    }
  }

  private loadRole(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    // 1. Thử đọc từ JWT payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload.roles ?? payload.authorities ?? [];
      const fromScope: string[] = payload.scope ? payload.scope.split(' ') : [];
      const allRoles = [...roles, ...fromScope, payload.role ?? ''];

      const found = allRoles.find(r =>
        typeof r === 'string' && (
          r.includes('INTERN') || r.includes('MENTOR') ||
          r.includes('MANAGER') || r.includes('HR') || r.includes('ADMIN')
        )
      );
      if (found) {
        this.roleSubject.next(found.replace('ROLE_', ''));
        return;
      }
    } catch {}

    // 2. Fallback: probe API
    this.http.get('http://localhost:8090/api/intern/tasks').subscribe({
      next: () => this.roleSubject.next('INTERN'),
      error: (err) => {
        if (err.status === 403) {
          this.http.get('http://localhost:8090/api/mentor/interns').subscribe({
            next: () => this.roleSubject.next('MENTOR'),
            error: () => this.roleSubject.next('ADMIN')
          });
        }
      }
    });
  }

  setRole(role: string): void {
    this.roleSubject.next(role);
  }

  getRole(): string {
    return this.roleSubject.value;
  }

  isIntern(): boolean { return this.roleSubject.value === 'INTERN'; }
  isMentor(): boolean { return this.roleSubject.value === 'MENTOR'; }
  isManager(): boolean { return this.roleSubject.value === 'MANAGER'; }
  isHr(): boolean { return this.roleSubject.value === 'HR'; }
  isAdmin(): boolean { return this.roleSubject.value === 'ADMIN'; }

  get role$() { return this.roleSubject.asObservable(); }
}
