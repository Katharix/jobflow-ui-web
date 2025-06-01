import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrganizationContextService } from './shared/organization-context.service';
import { map, take } from 'rxjs';

export const redirectIfOnboardedGuard: CanActivateFn = () => {
  const orgContext = inject(OrganizationContextService);
  const router = inject(Router);

  return orgContext.org$.pipe(
    take(1),
    map(org => {
      const shouldBlock = !!org?.onboardingComplete;

      if (shouldBlock) {
        router.navigateByUrl('/admin');
      }

      return !shouldBlock;
    })
  );
};
