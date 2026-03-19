import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import {
	BehaviorSubject,
	Observable,
	catchError,
	map,
	of,
	tap,
	fromEvent,
	merge,
	throttleTime,
	finalize,
} from 'rxjs';

export type AuthResult = 'success' | 'mfa_required' | 'failed';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	public isAuthenticating = signal(false);
	private platformId = inject(PLATFORM_ID);
	private http = inject(HttpClient);

	private get cachedIsLoggedIn(): boolean | null {
		if (!isPlatformBrowser(this.platformId)) return null;
		const cached = localStorage.getItem('isLoggedIn');
		return cached === null ? null : cached === 'true';
	}

	private isLoggedInSubject = new BehaviorSubject<boolean | null>(null);
	public isLoggedIn$ = this.isLoggedInSubject.asObservable();

	constructor() {
		if (isPlatformBrowser(this.platformId)) {
			this.isLoggedInSubject.next(this.cachedIsLoggedIn ?? false);
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
			fromEvent(document, 'scroll'),
		).pipe(throttleTime(60000));

		events$.subscribe(() => {
			// only refresh if logged in
			if (this.isLoggedInSubject.value === true) {
				this.checkAuthStatus();
			}
		});
	}

	// check if session exists on load
	private checkAuthStatus() {
		this.refreshAuthStatus().subscribe();
	}

	public refreshAuthStatus(): Observable<boolean> {
		return this.http
			.get('/api/check_auth', { observe: 'response', withCredentials: true })
			.pipe(
				map((response) => response.status === 200),
				catchError(() => of(false)),
				tap((isLoggedIn) => {
					this.isLoggedInSubject.next(isLoggedIn);
					localStorage.setItem('isLoggedIn', String(isLoggedIn));
				}),
			);
	}

	authenticate(username: string, password: string): Observable<AuthResult> {
		this.isAuthenticating.set(true);

		const body = new URLSearchParams();
		body.set('username', username);
		body.set('password', password);

		return this.http
			.post('/api/login', body.toString(), {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				observe: 'response',
				withCredentials: true,
			})
			.pipe(
				map((response) => {
					this.isAuthenticating.set(false);
					if (response.status === 200) {
						this.isLoggedInSubject.next(true);
						localStorage.setItem('isLoggedIn', 'true');
						return 'success' as AuthResult;
					}
					if (response.status === 202) {
						return 'mfa_required' as AuthResult;
					}
					return 'failed' as AuthResult;
				}),
				catchError(() => {
					this.isAuthenticating.set(false);
					this.isLoggedInSubject.next(false);
					localStorage.setItem('isLoggedIn', 'false');
					return of('failed' as AuthResult);
				}),
			);
	}

	verifyTotp(code: string): Observable<boolean> {
		this.isAuthenticating.set(true);

		return this.http
			.post(
				'/api/verify_totp',
				{ code },
				{
					observe: 'response',
					withCredentials: true,
				},
			)
			.pipe(
				map((response) => {
					this.isAuthenticating.set(false);
					const success = response.status === 200;
					if (success) {
						this.isLoggedInSubject.next(true);
						localStorage.setItem('isLoggedIn', 'true');
					}
					return success;
				}),
				catchError(() => {
					this.isAuthenticating.set(false);
					return of(false);
				}),
			);
	}

	logout(): Observable<void> {
		return this.http.post<void>('/api/logout', {}, { withCredentials: true }).pipe(
			finalize(() => {
				this.isLoggedInSubject.next(false);
				localStorage.setItem('isLoggedIn', 'false');
			}),
		);
	}
}
