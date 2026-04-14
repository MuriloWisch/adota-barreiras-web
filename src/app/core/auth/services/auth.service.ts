import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'adota_token';
  private readonly USER_KEY  = 'adota_user';

  currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  register(data: { name: string; email: string; password: string; phone?: string }): Observable<User> {
    return this.api.post<User>('/auth/register', data);
  }

  login(data: { email: string; password: string }): Observable<{ token: string; user: User }> {
    return this.api.post<{ token: string; user: User }>('/auth/login', data).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.currentUser$.next(response.user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  forgotPassword(email: string): Observable<any> {
    return this.api.post<any>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.api.post<any>(`/auth/reset-password?token=${token}`, { newPassword });
  }

  verifyEmail(token: string): Observable<any> {
    return this.api.get<any>('/auth/verify-email', { token });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentUser$.getValue()?.role === 'ADMIN';
  }

  loadUserFromStorage(): void {
    const raw = localStorage.getItem(this.USER_KEY);
    if (raw) {
      this.currentUser$.next(JSON.parse(raw));
    }
  }
}