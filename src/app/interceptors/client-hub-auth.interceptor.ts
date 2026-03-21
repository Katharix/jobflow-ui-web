import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { ClientHubAuthService } from '../client-hub/services/client-hub-auth.service';

export const clientHubAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(ClientHubAuthService);

  const isClientHubRequest = req.url.includes('/client-hub');
  const isClientHubAuthRequest = req.url.includes('/client-hub-auth');

  if (!isClientHubRequest || isClientHubAuthRequest) {
    return next(req);
  }

  const token = authService.getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
