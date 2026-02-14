import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http'
import { signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, fromEvent, merge, throttleTime } from 'rxjs';

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
      const cachedAuthStatus = localStorage.getItem('isLoggedIn');
      if (cachedAuthStatus === 'true') {
        this.isLoggedInSubject.next(true);
      }

      this.checkAuthStatus();
      this.setupActivityTracking();
    }
  }

  private setupActivityTracking() {
    if (!isPlatformBrowser(this.platformId)) return;

    const events$ = merge(
      fromEvent(document, 'click'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'scroll')
    ).pipe(
      throttleTime(60000)
    );

    events$.subscribe(() => {
      // only refresh if logged in
      if (this.isLoggedInSubject.value === true) {
        this.checkAuthStatus();
      }
    });
  }

  // check if session exists on load
  private checkAuthStatus() {
    this.http.get('/api/check_auth', { observe: 'response', withCredentials: true }).subscribe({
      next: (response) => {
        const isLoggedIn = response.status === 200;
        this.isLoggedInSubject.next(isLoggedIn);
        localStorage.setItem('isLoggedIn', String(isLoggedIn));
      },
      error: (err) => {
        this.isLoggedInSubject.next(false);
        localStorage.setItem('isLoggedIn', 'false');
      }
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
          localStorage.setItem('isLoggedIn', 'true');
          return true;
        }
        return false;
      }),
      catchError(() => {
        this.isAuthenticating.set(false);
        this.isLoggedInSubject.next(false);
        localStorage.setItem('isLoggedIn', 'false');
        return of(false);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        this.isLoggedInSubject.next(false)
        localStorage.setItem('isLoggedIn', 'false');
      })
    );
  }
}
