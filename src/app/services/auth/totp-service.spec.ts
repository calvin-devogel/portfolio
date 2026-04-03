import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TotpService } from './totp-service';

describe('TotpService', () => {
	let service: TotpService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [TotpService, provideHttpClient(), provideHttpClientTesting()],
		});
		service = TestBed.inject(TotpService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('getStatus()', () => {
		it('should return totp status on success', () => {
			let result: unknown;
			service.getStatus().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/status');
			expect(req.request.method).toBe('GET');
			expect(req.request.withCredentials).toBe(true);
			req.flush({ totp_enabled: true });

			expect(result).toEqual({ totp_enabled: true });
		});

		it('should return null on network error', () => {
			let result: unknown = 'not-null';
			service.getStatus().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/status');
			req.error(new ProgressEvent('network error'));

			expect(result).toBeNull();
		});

		it('should return null on HTTP error response', () => {
			let result: unknown = 'not-null';
			service.getStatus().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/status');
			req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

			expect(result).toBeNull();
		});
	});

	describe('setup()', () => {
		it('should return the otpauth_uri on success', () => {
			const uri = 'otpauth://totp/example?secret=ABC123';
			let result: unknown;
			service.setup().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/setup');
			expect(req.request.method).toBe('GET');
			expect(req.request.withCredentials).toBe(true);
			req.flush({ otpauth_uri: uri });

			expect(result).toBe(uri);
		});

		it('should return null on network error', () => {
			let result: unknown = 'not-null';
			service.setup().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/setup');
			req.error(new ProgressEvent('network error'));

			expect(result).toBeNull();
		});

		it('should return null on HTTP error response', () => {
			let result: unknown = 'not-null';
			service.setup().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/setup');
			req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

			expect(result).toBeNull();
		});
	});

	describe('confirm()', () => {
		it('should return ok on 200', () => {
			let result: unknown;
			service.confirm('123456').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/confirm');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ code: '123456' });
			expect(req.request.withCredentials).toBe(true);
			req.flush({}, { status: 200, statusText: 'OK' });

			expect(result).toBe('ok');
		});

		it('should return error on network error', () => {
			let result: unknown;
			service.confirm('123456').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/confirm');
			req.error(new ProgressEvent('network error'));

			expect(result).toBe('error');
		});

		// Angular's HttpClient throws on 4xx even with observe: 'response',
		// so 409 and other error responses fall through to catchError.
		it('should return error on 409 conflict', () => {
			let result: unknown;
			service.confirm('123456').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/confirm');
			req.flush({}, { status: 409, statusText: 'Conflict' });

			expect(result).toBe('error');
		});

		it('should return error on 422 unprocessable entity', () => {
			let result: unknown;
			service.confirm('bad-code').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/confirm');
			req.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

			expect(result).toBe('error');
		});
	});

	describe('disable()', () => {
		it('should return ok on 200', () => {
			let result: unknown;
			service.disable('mypassword').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/disable');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ password: 'mypassword' });
			expect(req.request.withCredentials).toBe(true);
			req.flush({}, { status: 200, statusText: 'OK' });

			expect(result).toBe('ok');
		});

		it('should return error on network error', () => {
			let result: unknown;
			service.disable('mypassword').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/disable');
			req.error(new ProgressEvent('network error'));

			expect(result).toBe('error');
		});

		// 4xx responses (e.g. wrong password → 401) go to catchError, not map.
		it('should return error on 401 unauthorized', () => {
			let result: unknown;
			service.disable('wrongpassword').subscribe((r) => (result = r));

			const req = httpMock.expectOne('/v1/admin/totp/disable');
			req.flush({}, { status: 401, statusText: 'Unauthorized' });

			expect(result).toBe('error');
		});
	});
});
