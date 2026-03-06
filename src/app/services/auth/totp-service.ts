import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface TotpStatus { totp_enabled: boolean; }

@Injectable({
  providedIn: 'root',
})
export class TotpService {
  private http = inject(HttpClient);

  getStatus(): Observable<TotpStatus | null> {
    return this.http.get<TotpStatus>('/api/admin/totp/status', { withCredentials: true }).pipe(
      catchError(() => of(null))
    );
  }

  setup(): Observable<string | null> {
    return this.http.get<{ otpauth_uri: string }>('/api/admin/totp/setup', { withCredentials: true }).pipe(
      map(response => response.otpauth_uri),
      catchError(() => of(null))
    );
  }

  confirm(code: string): Observable<'ok' | 'invalid' | 'already_enabled' | 'error'> {
    return this.http.post('/api/admin/totp/confirm', { code }, {
      observe: 'response',
      withCredentials: true
    }).pipe(
      map(response => {
        if (response.status === 200) return 'ok';
        if (response.status === 409) return 'already_enabled';
        return 'invalid';
      }),
      catchError(() => of('error' as const))
    );
  }

  disable(password: string): Observable<'ok' | 'invalid_password' | 'error'> {
    return this.http.post('/api/admin/totp/disable', { password }, {
      observe: 'response',
      withCredentials: true
    }).pipe(
      map(response => response.status === 200 ? 'ok' : 'invalid_password'),
      catchError(() => of('error' as const))
    )
  }
}
