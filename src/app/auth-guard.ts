import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, of } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { AuthService } from './services/auth/auth-service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    // sus
    return of(false);
  }

  return authService.refreshAuthStatus().pipe(
    timeout(5000),
    map((isLoggedIn) =>
      isLoggedIn ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
    ),
    catchError(() => of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })))
  );
};
