import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth/auth-service';
import { filter, map, take, timeout } from 'rxjs/operators';
import { catchError, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return authService.isLoggedIn$.pipe(
    filter(isLoggedIn => isLoggedIn !== null),
    take(1),
    timeout(5000),
    map(isLoggedIn => isLoggedIn ? true : router.createUrlTree(['/login'])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
