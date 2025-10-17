import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { OrganizationContextService } from './shared/organization-context.service';
import { map, take } from 'rxjs';

export const onboardingGuard: CanActivateChildFn = () => {
  const orgContext = inject(OrganizationContextService);
  const router = inject(Router);

  return orgContext.org$.pipe(
    take(1),
    map(org => {
      const shouldProceed = !!org?.onboardingComplete;

      if (!shouldProceed) {
        router.navigateByUrl('/onboarding');
      }

      return shouldProceed;
    })
  );
};
