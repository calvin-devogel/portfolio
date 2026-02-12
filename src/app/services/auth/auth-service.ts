import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http'
import { signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean | null>(null);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  public isAuthenticating = signal(false);

  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus();
    } else {
      this.isLoggedInSubject.next(false);
    }
  }

  // check if session exists on load
  private checkAuthStatus() {
    this.http.get('/api/check_auth', { observe: 'response' }).subscribe({
      next: (response) => {
        if (response.status === 200) this.isLoggedInSubject.next(true);
        else this.isLoggedInSubject.next(false);
      },
      error: () => this.isLoggedInSubject.next(false)
    });
  }

  authenticate(username: string, password: string): Observable<boolean> {
    this.isAuthenticating.set(true);

    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    return this.http.post('/api/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      observe: 'response',
      withCredentials: true
    }).pipe(
      map(response => {
        this.isAuthenticating.set(false);
        if (response.status === 200) {
          this.isLoggedInSubject.next(true);
          return true;
        }
        return false;
      }),
      catchError(() => {
        this.isAuthenticating.set(false);
        this.isLoggedInSubject.next(false);
        return of(false);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/logout', {}, { withCredentials: true }).pipe(
      tap(() => this.isLoggedInSubject.next(false))
    );
  }
}
