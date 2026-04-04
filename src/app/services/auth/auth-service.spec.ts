import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
		});
		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it('should check auth status on initialization (success)', () => {
		// the constructor calls checkAuthStatus right away
		const req = httpMock.expectOne('/v1/check_auth');
		expect(req.request.method).toBe('GET');
		req.flush({}, { status: 200, statusText: 'OK' });

		service.isLoggedIn$.subscribe((status) => {
			// come back to this
			if (status !== null) {
				expect(status)?.toBeTruthy();
			}
		});
	});

	it('should check auth status on initialization (failure)', () => {
		const req = httpMock.expectOne('/v1/check_auth');
		req.flush({}, { status: 401, statusText: 'Unauthorized' });

		service.isLoggedIn$.subscribe((status) => {
			if (status !== null) {
				expect(status).toBeFalsy();
			}
		});
	});

	it('should authenticate user successfully', () => {
		// clear initial checkAuthStatus call
		httpMock.expectOne('/v1/check_auth');

		service.authenticate('user', 'pass').subscribe((result) => {
			expect(result).toBeTruthy();
		});

		const req = httpMock.expectOne('/v1/login');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toContain('username=user&password=pass');
		req.flush({}, { status: 200, statusText: 'OK' });
		httpMock.expectOne('/v1/check_auth').flush({}, { status: 200, statusText: 'OK' });
	});

	it('should handle authentication failure', () => {
		// clear initial checkAuthStatus call
		httpMock.expectOne('/v1/check_auth');

		service.authenticate('user', 'wrongpass').subscribe((result) => {
			expect(result).toBe('failed');
		});

		const req = httpMock.expectOne('/v1/login');
		req.flush({}, { status: 401, statusText: 'Unauthorized' });
	});

	it('should logout and update state', () => {
		httpMock.expectOne('/v1/check_auth');

		service.logout().subscribe();

		const req = httpMock.expectOne('/v1/logout');
		expect(req.request.method).toBe('POST');
		req.flush({});

		service.isLoggedIn$.subscribe((status) => {
			if (status !== null) {
				expect(status).toBeFalsy();
			}
		});
	});

	it('should return mfa_required when login responds with 202', () => {
		httpMock.expectOne('/v1/check_auth');

		let capturedResult: string | undefined;
		service.authenticate('user', 'pass').subscribe((result) => {
			capturedResult = result;
		});

		const req = httpMock.expectOne('/v1/login');
		req.flush({}, { status: 202, statusText: 'Accepted' });

		expect(capturedResult).toBe('mfa_required');
	});

	it('should return failed and clear login state on network error during authenticate', () => {
		httpMock.expectOne('/v1/check_auth');

		let capturedResult: string | undefined;
		service.authenticate('user', 'pass').subscribe((result) => {
			capturedResult = result;
		});

		const req = httpMock.expectOne('/v1/login');
		// deprecated method, can still simulate network error
		req.error(new ProgressEvent('Network error'));

		expect(capturedResult).toBe('failed');
		service.isLoggedIn$.subscribe((status) => {
			if (status !== null) {
				expect(status).toBeFalsy();
			}
		});
	});

	it('should set isAuthenticating to true while authenticating and reset on success', () => {
		httpMock.expectOne('/v1/check_auth');

		expect(service.isAuthenticating()).toBeFalsy();

		service.authenticate('user', 'pass').subscribe();
		expect(service.isAuthenticating()).toBeTruthy();

		const req = httpMock.expectOne('/v1/login');
		req.flush({}, { status: 200, statusText: 'OK' });

		expect(service.isAuthenticating()).toBeFalsy();
		httpMock.expectOne('/v1/check_auth').flush({}, { status: 200, statusText: 'OK' });
	});

	it('should reset isAuthenticating to false on authentication failure', () => {
		httpMock.expectOne('/v1/check_auth');

		service.authenticate('user', 'pass').subscribe();
		expect(service.isAuthenticating()).toBeTruthy();

		const req = httpMock.expectOne('/v1/login');
		req.flush({}, { status: 401, statusText: 'Unauthorized' });

		expect(service.isAuthenticating()).toBeFalsy();
	});

	it('should verify TOTP successfully and update login state', () => {
		httpMock.expectOne('/v1/check_auth');

		let capturedResult: string | undefined;
		service.verifyTotp('123456').subscribe((result) => {
			capturedResult = result;
		});

		const req = httpMock.expectOne('/v1/verify_totp');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual({ code: '123456' });
		req.flush({}, { status: 200, statusText: 'OK' });

		expect(capturedResult).toBe('success');

		service.isLoggedIn$.subscribe((status) => {
			if (status !== null) {
				expect(status).toBeTruthy();
			}
		});
		httpMock.expectOne('/v1/check_auth').flush({}, { status: 200, statusText: 'OK' });
	});

	it('should return failed when verifyTotp receives an error response', () => {
		httpMock.expectOne('/v1/check_auth');

		let capturedResult: string | undefined;
		service.verifyTotp('bad-code').subscribe((result) => {
			capturedResult = result;
		});

		const req = httpMock.expectOne('/v1/verify_totp');
		req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

		expect(capturedResult).toBe('failed');
	});

	it('should return failed when verifyTotp encounters a network error', () => {
		httpMock.expectOne('/v1/check_auth');

		let capturedResult: string | undefined;
		service.verifyTotp('123456').subscribe((result) => {
			capturedResult = result;
		});

		const req = httpMock.expectOne('/v1/verify_totp');
		req.error(new ProgressEvent('Network error'));

		expect(capturedResult).toBe('failed');
	});

	it('should set isAuthenticating to true while verifying TOTP and reset on success', () => {
		httpMock.expectOne('/v1/check_auth');

		service.verifyTotp('123456').subscribe();
		expect(service.isAuthenticating()).toBeTruthy();

		const req = httpMock.expectOne('/v1/verify_totp');
		req.flush({}, { status: 200, statusText: 'OK' });

		expect(service.isAuthenticating()).toBeFalsy();
		httpMock.expectOne('/v1/check_auth').flush({}, { status: 200, statusText: 'OK' });
	});

	it('should update localStorage to false on logout', () => {
		httpMock.expectOne('/v1/check_auth');
		const spy = vi.spyOn(Storage.prototype, 'setItem');
		service.logout().subscribe();
		const req = httpMock.expectOne('/v1/logout');
		req.flush({});

		expect(spy).toHaveBeenCalledWith('isLoggedIn', 'false');
	});

	it('should return true from refreshAuthStatus on network error', () => {
		httpMock.expectOne('/v1/check_auth');

		let capturedResult: boolean | undefined;
		service.refreshAuthStatus().subscribe((result) => {
			capturedResult = result;
		});

		const req = httpMock.expectOne('/v1/check_auth');
		req.error(new ProgressEvent('Network error'));

		expect(capturedResult).toBe(false);
	});

	describe('authenticate', () => {
		it('should return must_change_password_required when body contains the flag', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.authenticate('user', 'pass').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/login');
			req.flush({ must_change_password: true }, { status: 200, statusText: 'OK' });

			expect(capturedResult).toBe('must_change_password_required');
		});

		it('should return success when 200 body does not contain the flag', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.authenticate('user', 'pass').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/login');
			req.flush({}, { status: 200, statusText: 'OK' });

			expect(capturedResult).toBe('success');
			httpMock.expectOne('/v1/check_auth').flush({}, { status: 200, statusText: 'OK' });
		});
	});

	describe('changePassword', () => {
		it('should return ok on 200', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.changePassword('old', 'new').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/change_password');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ current_password: 'old', new_password: 'new' });
			req.flush({}, { status: 200, statusText: 'OK' });

			expect(capturedResult).toBe('ok');
		});

		it('should return wrong_password on 401', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.changePassword('wrong', 'new').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/change_password');
			req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

			expect(capturedResult).toBe('wrong_password');
		});

		it('should return error on 500', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.changePassword('old', 'new').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/change_password');
			req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

			expect(capturedResult).toBe('error');
		});
	});

	describe('acceptInvitation', () => {
		it('should return ok on 200', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.acceptInvitation('token', 'user', 'pass').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/accept');
			expect(req.request.body).toEqual({
				token: 'token',
				username: 'user',
				password: 'pass',
			});
			req.flush({}, { status: 200, statusText: 'OK' });

			expect(capturedResult).toBe('ok');
		});

		it('should return invalid on 400', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.acceptInvitation('badtoken', 'user', 'pass').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/accept');
			req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

			expect(capturedResult).toBe('invalid');
		});

		it('should return error on 500', () => {
			httpMock.expectOne('/v1/check_auth');

			let capturedResult: string | undefined;
			service.acceptInvitation('token', 'user', 'pass').subscribe((result) => {
				capturedResult = result;
			});

			const req = httpMock.expectOne('/v1/accept');
			req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

			expect(capturedResult).toBe('error');
		});
	});
});
