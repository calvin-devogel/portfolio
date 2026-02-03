import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  // check if session exists on load
  private checkAuthStatus() {
    this.http.get('/api/check-auth', { observe: 'response' }).subscribe({
      next: (response) => {
        if (response.status === 200) this.isLoggedInSubject.next(true);
      },
      error: () => this.isLoggedInSubject.next(false)
    });
  }

  authenticate(username: string, password: string): Observable<boolean> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    return this.http.post('/api/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      observe: 'response',
      withCredentials: true
    }).pipe(
      map(response => {
        if (response.status === 200) {
          this.isLoggedInSubject.next(true);
          return true;
        }
        return false;
      }),
      catchError(() => {
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
