import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { of } from 'rxjs';
import { AuthService } from './services/auth/auth-service';
import { CanActivateFn } from '@angular/router';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let authServiceMock: { isLoggedIn$: any };
  let routerMock: { createUrlTree: Mock };

  beforeEach(() => {
    authServiceMock = {
      isLoggedIn$: of(false)
    };

    routerMock = {
      createUrlTree: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access if the user is logged in', () => new Promise<void>(done => {
    authServiceMock.isLoggedIn$ = of(true);

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);

      (result as any).subscribe((res: boolean | UrlTree) => {
        expect(res).toBe(true);
        done();
      });
    });
  }));

  it('should redirect if the user is not logged in', () => new Promise<void>(done => {
    const dummyUrlTree = {} as UrlTree;
    routerMock.createUrlTree.mockReturnValue(dummyUrlTree);
    authServiceMock.isLoggedIn$ = of(false);

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);

      (result as any).subscribe((res: boolean | UrlTree) => {
        expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
        expect(res).toBe(dummyUrlTree);
        done();
      });
    })
  }));
});
