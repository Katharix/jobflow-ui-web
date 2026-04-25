import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export type MilestoneName = 'firstRealEstimateSentAt' | 'referralCtaShownAt';

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private api = inject(BaseApiService);

  markMilestone(milestone: MilestoneName): Observable<void> {
    return this.api.post<void>('organizations/milestones', { milestone });
  }
}
