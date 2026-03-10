import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { OrganizationContextService } from '../../services/shared/organization-context.service';

type Plan = 'Go' | 'Flow' | 'Max';

function rank(plan: string | null | undefined): number {
  const p = (plan ?? '').toLowerCase();
  if (p === 'go') return 0;
  if (p === 'flow') return 1;
  if (p === 'max') return 2;
  return -1;
}

export const subscriptionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const orgContext = inject(OrganizationContextService);

  // route.data['minPlan'] = 'Go' | 'Flow' | 'Max'
  const minPlan = (route.data?.['minPlan'] as Plan | undefined) ?? 'Go';

  return orgContext.org$.pipe(
    map((org) => {
      const currentPlan = org?.subscriptionPlanName as string | undefined;

      if (rank(currentPlan) >= rank(minPlan)) return true;

      return router.createUrlTree(['/subscription-required'], {
        queryParams: {
          required: minPlan,
          current: currentPlan ?? 'None',
        },
      });
    })
  );
};