import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { SupportHubTicket } from '../models/support-hub-ticket';
import { SupportHubSession } from '../models/support-hub-session';

interface SupportHubScreenResponse {
  sessionId: string;
  viewerUrl: string;
}

interface SupportHubSeedResponse {
  ticketsCreated: number;
  sessionsCreated: number;
}

@Injectable({ providedIn: 'root' })
export class SupportHubDataService {
  private api = inject(BaseApiService);
  private apiUrl = 'supporthub';

  getTickets(): Observable<SupportHubTicket[]> {
    return this.api.get<SupportHubTicket[]>(`${this.apiUrl}/tickets`);
  }

  getSessions(): Observable<SupportHubSession[]> {
    return this.api.get<SupportHubSession[]>(`${this.apiUrl}/sessions`);
  }

  createTicket(payload: {
    organizationId: string;
    title: string;
    summary?: string | null;
    status: string;
  }): Observable<SupportHubTicket> {
    return this.api.post<SupportHubTicket>(`${this.apiUrl}/tickets`, payload);
  }

  createSession(payload: {
    organizationId: string;
    agentName: string;
    status: string;
  }): Observable<SupportHubSession> {
    return this.api.post<SupportHubSession>(`${this.apiUrl}/sessions`, payload);
  }

  seedDemo(organizationId: string): Observable<SupportHubSeedResponse> {
    return this.api.post<SupportHubSeedResponse>(`${this.apiUrl}/seed`, { organizationId });
  }

  requestScreenView(sessionId: string): Observable<SupportHubScreenResponse> {
    return this.api.post<SupportHubScreenResponse>(`${this.apiUrl}/sessions/${sessionId}/screen`, {});
  }
}
