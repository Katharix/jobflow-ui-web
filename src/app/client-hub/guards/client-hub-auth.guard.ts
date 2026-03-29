import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClientHubAuthService } from '../services/client-hub-auth.service';

export const clientHubAuthGuard: CanActivateFn = (_route, state) => {
  const authService = inject(ClientHubAuthService);
  const router = inject(Router);

  if (authService.hasToken()) {
    return true;
  }

  router.navigate(['/client-hub/auth'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
