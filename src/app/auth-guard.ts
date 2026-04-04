import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { AuthService } from './services/auth/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const platformId = inject(PLATFORM_ID);

	if (!isPlatformBrowser(platformId)) {
		return of(false);
	}

	const requiredRoles = route.data?.['roles'] as string[] | undefined;
	const redirect = router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });

	return authService.refreshAuthStatus().pipe(
		timeout(5000),
		switchMap((isLoggedIn) => {
			if (!isLoggedIn) return of(redirect);
			if (!requiredRoles) return of(true as const);
			return authService.userRole$.pipe(
				take(1),
				map((role) => (role && requiredRoles.includes(role) ? true : redirect)),
			);
		}),
		catchError(() =>
			of(router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } })),
		),
	);
};
