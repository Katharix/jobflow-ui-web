import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { SupportHubInvite } from '../models/support-hub-invite';

interface InviteValidation {
  invite?: SupportHubInvite;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SupportHubInviteService {
  private api = inject(BaseApiService);
  private apiUrl = 'supporthub/invites';

  createInvite(role: SupportHubInvite['role']): Observable<SupportHubInvite> {
    return this.api.post<SupportHubInvite>(this.apiUrl, { role });
  }

  listInvites(): Observable<SupportHubInvite[]> {
    return this.api.get<SupportHubInvite[]>(this.apiUrl);
  }

  validateInvite(code: string): Observable<InviteValidation> {
    const trimmed = code.trim();
    return this.api.get<InviteValidation>(`${this.apiUrl}/validate/${encodeURIComponent(trimmed)}`);
  }

  redeemInvite(code: string): Observable<void> {
    return this.api.post<void>(`${this.apiUrl}/redeem`, { code });
  }
}
