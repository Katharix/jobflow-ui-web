import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ClientHubAuthService } from '../client-hub/services/client-hub-auth.service';

export const clientHubAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(ClientHubAuthService);

  const isClientHubRequest = req.url.includes('/client-hub');
  const isClientHubAuthRequest = req.url.includes('/client-hub-auth');

  if (!isClientHubRequest || isClientHubAuthRequest) {
    return next(req);
  }

  const authedReq = req.clone({ withCredentials: true });

  const router = inject(Router);

  return next(authedReq).pipe(
    catchError((error) => {
      if (error?.status === 401 || error?.status === 403) {
        authService.handleUnauthorized(router, router.url);
      }
      return throwError(() => error);
    }),
  );
};
