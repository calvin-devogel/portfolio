import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@app/shared/services/notification-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const silentUrls = ['/v1/check_auth', '/v1/web_vitals'];
    if (silentUrls.some((url) => req.url.includes(url))) {
        return next(req);
    }

    const notificationService = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred.';

            if (error.error && !(error.error instanceof ErrorEvent)) {
                try {
                    const body = typeof error.error === 'string'
                        ? JSON.parse(error.error)
                        : error.error;
                    errorMessage = body?.message ?? errorMessage;
                } catch {
                    // non-JSON body, keep default message
                }
            }

            notificationService.error(errorMessage);
            return throwError(() => error);
        }),
    );
};
