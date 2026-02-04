import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController)
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should check auth status on initialization (success)', () => {
    // the constructor calls checkAuthStatus right away
    const req = httpMock.expectOne('/api/check-auth');
    expect(req.request.method).toBe('GET');
    req.flush({}, { status: 200, statusText: 'OK' });

    service.isLoggedIn$.subscribe(status => {
      // come back to this
      if (status !== null) {
        expect(status)?.toBeTruthy();
      }
    });
  });

  it('should check auth status on initialization (failure)', () => {
    const req = httpMock.expectOne('/api/check-auth');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    service.isLoggedIn$.subscribe(status => {
      if (status !== null) {
        expect(status).toBeFalsy();
      }
    });
  });

  it('should authenticate user successfully', () => {
    // clear initial checkAuthStatus call
    httpMock.expectOne('/api/check-auth');

    service.authenticate('user', 'pass').subscribe(result => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toContain('username=user&password=pass');
    req.flush({}, { status: 200, statusText: 'OK' });
  });

  it('should handle authentication failure', () => {
    // clear initial checkAuthStatus call
    httpMock.expectOne('/api/check-auth');

    service.authenticate('user', 'wrongpass').subscribe(result => {
      expect(result).toBeFalsy();
    });

    const req = httpMock.expectOne('/api/login');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should logout and update state', () => {
    httpMock.expectOne('/api/check-auth');

    service.logout().subscribe();

    const req = httpMock.expectOne('/api/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    service.isLoggedIn$.subscribe(status => {
      if (status !== null) {
        expect(status).toBeFalsy();
      }
    });
  });
});
