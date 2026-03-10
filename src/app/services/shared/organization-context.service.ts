import { Injectable } from '@angular/core';
import { OrganizationDto } from '../../models/organization';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private orgSubject = new BehaviorSubject<OrganizationDto | null>(null);
  org$ = this.orgSubject.asObservable();

  constructor() {
    this.loadOrgFromStorage();
  }

  setOrganization(org: OrganizationDto) {
    this.orgSubject.next(org);
    localStorage.setItem('org', JSON.stringify(org));
  }
  hasMinPlan$(minPlan: 'Go' | 'Flow' | 'Max') {
    return this.org$.pipe(
      map((org) => {
        const current = (org?.subscriptionPlanName ?? '').toLowerCase();
        const rank = { go: 0, flow: 1, max: 2 } as const;
        const currentRank = rank[current as keyof typeof rank] ?? -1;
        const minRank = rank[minPlan.toLowerCase() as keyof typeof rank];
        return currentRank >= minRank;
      })
    );
  }

  private loadOrgFromStorage() {
    const raw = localStorage.getItem('org');
    if (raw) {
      this.orgSubject.next(JSON.parse(raw));
    }
  }

  clearOrganization() {
    localStorage.removeItem('org');
    this.orgSubject.next(null);
  }
}
