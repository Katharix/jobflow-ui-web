import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map, of, switchMap, take } from 'rxjs';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationService } from '../../services/shared/organization.service';

function isExpired(status: string | null | undefined, expiresAt: string | null | undefined): boolean {
  if ((status ?? '').toLowerCase() !== 'canceled') return false;
  if (!expiresAt) return true;

  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return true;

  return expires.getTime() <= Date.now();
}

export const subscriptionAccessGuard: CanActivateChildFn = (childRoute) => {
  const router = inject(Router);
  const orgContext = inject(OrganizationContextService);
  const organizationService = inject(OrganizationService);

  const allowExpiredAccess = !!childRoute.data?.['allowExpiredAccess'];

  return orgContext.org$.pipe(
    take(1),
    switchMap((org) => {
      if (!org?.id) return of(true);

      const check = (status?: string, expiresAt?: string) => {
        if (!isExpired(status, expiresAt)) return true;
        if (allowExpiredAccess) return true;

        return router.createUrlTree(['/subscription-required'], {
          queryParams: {
            status: status ?? 'canceled',
            expiresAt: expiresAt ?? '',
          },
        });
      };

      if (org.subscriptionStatus || org.subscriptionExpiresAt) {
        return of(check(org.subscriptionStatus, org.subscriptionExpiresAt));
      }

      return organizationService.getOrganizationById({ organizationId: org.id }).pipe(
        map((latest) => {
          if (latest) {
            orgContext.setOrganization(latest);
          }

          return check(latest?.subscriptionStatus, latest?.subscriptionExpiresAt);
        })
      );
    })
  );
};
