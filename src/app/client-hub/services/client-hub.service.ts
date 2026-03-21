import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { ClientHubAuthService } from './client-hub-auth.service';
import {
  ClientHubEstimate,
  ClientHubInvoice,
  ClientHubProfile,
  ClientHubWorkRequest,
  ClientHubWorkRequestResponse,
  ClientHubJobSummary,
  ClientHubTimelineItem,
  UpdateClientHubProfileRequest,
} from '../models/client-hub.models';

@Injectable({ providedIn: 'root' })
export class ClientHubService {
  private readonly api = inject(BaseApiService);
  private readonly auth = inject(ClientHubAuthService);
  private readonly baseUrl = 'client-hub';

  getMe(): Observable<ClientHubProfile> {
    return this.api.getWithHeaders<ClientHubProfile>(`${this.baseUrl}/me`, this.getAuthHeaders());
  }

  updateMe(request: UpdateClientHubProfileRequest): Observable<ClientHubProfile> {
    return this.api.putWithHeaders<ClientHubProfile>(`${this.baseUrl}/me`, request, this.getAuthHeaders());
  }

  getEstimates(): Observable<ClientHubEstimate[]> {
    return this.api.getWithHeaders<ClientHubEstimate[]>(
      `${this.baseUrl}/estimates`,
      this.getAuthHeaders(),
    );
  }

  getEstimateById(id: string): Observable<ClientHubEstimate> {
    return this.api.getWithHeaders<ClientHubEstimate>(
      `${this.baseUrl}/estimates/${id}`,
      this.getAuthHeaders(),
    );
  }

  acceptEstimate(id: string): Observable<void> {
    return this.api.postWithHeaders<void>(
      `${this.baseUrl}/estimates/${id}/accept`,
      {},
      this.getAuthHeaders(),
    );
  }

  declineEstimate(id: string): Observable<void> {
    return this.api.postWithHeaders<void>(
      `${this.baseUrl}/estimates/${id}/decline`,
      {},
      this.getAuthHeaders(),
    );
  }

  getInvoices(): Observable<ClientHubInvoice[]> {
    return this.api.getWithHeaders<ClientHubInvoice[]>(
      `${this.baseUrl}/invoices`,
      this.getAuthHeaders(),
    );
  }

  getInvoiceById(id: string): Observable<ClientHubInvoice> {
    return this.api.getWithHeaders<ClientHubInvoice>(
      `${this.baseUrl}/invoices/${id}`,
      this.getAuthHeaders(),
    );
  }

  getJobs(): Observable<ClientHubJobSummary[]> {
    return this.api.getWithHeaders<ClientHubJobSummary[]>(
      `${this.baseUrl}/jobs`,
      this.getAuthHeaders(),
    );
  }

  getJobById(id: string): Observable<ClientHubJobSummary> {
    return this.api.getWithHeaders<ClientHubJobSummary>(
      `${this.baseUrl}/jobs/${id}`,
      this.getAuthHeaders(),
    );
  }

  getJobTimeline(id: string): Observable<ClientHubTimelineItem[]> {
    return this.api.getWithHeaders<ClientHubTimelineItem[]>(
      `${this.baseUrl}/jobs/${id}/timeline`,
      this.getAuthHeaders(),
    );
  }

  getJobUpdateAttachment(jobId: string, updateId: string, attachmentId: string): Observable<Blob> {
    return this.api.getBlobWithHeaders(
      `${this.baseUrl}/jobs/${jobId}/updates/${updateId}/attachments/${attachmentId}`,
      this.getAuthHeaders(),
    );
  }

  requestWork(request: ClientHubWorkRequest): Observable<ClientHubWorkRequestResponse> {
    return this.api.postWithHeaders<ClientHubWorkRequestResponse>(
      `${this.baseUrl}/work-requests`,
      request,
      this.getAuthHeaders(),
    );
  }

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.auth.getToken();
    if (!token) return undefined;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
