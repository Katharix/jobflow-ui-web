import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationService } from '../../services/shared/organization.service';

type Plan = 'Go' | 'Flow' | 'Max';

function rank(plan: string | null | undefined): number {
  const p = (plan ?? '').toLowerCase();
  if (p === 'go') return 0;
  if (p === 'flow') return 1;
  if (p === 'max') return 2;
  return -1;
}

function toGateDecision(currentPlan: string | null | undefined, minPlan: Plan, router: Router) {
  if (rank(currentPlan) >= rank(minPlan)) return true;

  return router.createUrlTree(['/subscription-required'], {
    queryParams: {
      required: minPlan,
      current: currentPlan ?? 'None',
    },
  });
}

export const subscriptionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const orgContext = inject(OrganizationContextService);
  const organizationService = inject(OrganizationService);

  // route.data['minPlan'] = 'Go' | 'Flow' | 'Max'
  const minPlan = (route.data?.['minPlan'] as Plan | undefined) ?? 'Go';

  return orgContext.org$.pipe(
    take(1),
    switchMap((org) => {
      const currentPlan = org?.subscriptionPlanName as string | undefined;
      const organizationId = org?.id;

      // If cache is missing the plan, refresh org once before gating.
      if (!currentPlan && organizationId) {
        return organizationService.getOrganizationById({ organizationId }).pipe(
          map((latestOrg) => {
            if (latestOrg) {
              orgContext.setOrganization(latestOrg);
            }

            return toGateDecision(latestOrg?.subscriptionPlanName, minPlan, router);
          }),
          catchError(() => of(toGateDecision(currentPlan, minPlan, router)))
        );
      }

      return of(toGateDecision(currentPlan, minPlan, router));
    })
  );
};