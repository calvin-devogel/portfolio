import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { Observable, of } from 'rxjs';
import { AuthService } from './services/auth/auth-service';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
	let authServiceMock: {
		refreshAuthStatus: Mock;
		isLoggedIn$: Observable<boolean>;
		userRole$: Observable<string | null>;
	};
	let routerMock: { createUrlTree: Mock };

	beforeEach(() => {
		authServiceMock = {
			refreshAuthStatus: vi.fn(() => of(false)),
			isLoggedIn$: of(false),
			userRole$: of(null),
		};

		routerMock = {
			createUrlTree: vi.fn(),
		};

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: Router, useValue: routerMock },
			],
		});
	});

	it('should allow access if the user is logged in', () =>
		new Promise<void>((done) => {
			authServiceMock.isLoggedIn$ = of(true);

			TestBed.runInInjectionContext(() => {
				const result = authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

				(result as Observable<boolean | UrlTree>).subscribe((res: boolean | UrlTree) => {
					expect(res).toBe(true);
					done();
				});
			});
		}));

	it('should redirect if the user is not logged in', () =>
		new Promise<void>((done) => {
			const dummyUrlTree = {} as UrlTree;
			routerMock.createUrlTree.mockReturnValue(dummyUrlTree);
			authServiceMock.isLoggedIn$ = of(false);

			TestBed.runInInjectionContext(() => {
				const result = authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

				(result as Observable<boolean | UrlTree>).subscribe((res: boolean | UrlTree) => {
					expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/'], {
						queryParams: { returnUrl: undefined },
					});
					expect(res).toBe(dummyUrlTree);
					done();
				});
			});
		}));
});
