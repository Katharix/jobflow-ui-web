import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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
  ClientHubDepositResponse,
  UpdateClientHubProfileRequest,
  OrganizationBranding,
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
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/estimates`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeCollection<ClientHubEstimate>(response)));
  }

  getEstimateById(id: string): Observable<ClientHubEstimate> {
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/estimates/${id}`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeItem<ClientHubEstimate>(response)));
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
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/invoices`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeCollection<ClientHubInvoice>(response)));
  }

  getInvoiceById(id: string): Observable<ClientHubInvoice> {
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/invoices/${id}`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeItem<ClientHubInvoice>(response)));
  }

  getJobs(): Observable<ClientHubJobSummary[]> {
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/jobs`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeCollection<ClientHubJobSummary>(response)));
  }

  getJobById(id: string): Observable<ClientHubJobSummary> {
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/jobs/${id}`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeItem<ClientHubJobSummary>(response)));
  }

  getJobTimeline(id: string): Observable<ClientHubTimelineItem[]> {
    return this.api.getWithHeaders<unknown>(
      `${this.baseUrl}/jobs/${id}/timeline`,
      this.getAuthHeaders(),
    ).pipe(map((response) => this.normalizeCollection<ClientHubTimelineItem>(response)));
  }

  getJobUpdateAttachment(jobId: string, updateId: string, attachmentId: string): Observable<Blob> {
    return this.api.getBlobWithHeaders(
      `${this.baseUrl}/jobs/${jobId}/updates/${updateId}/attachments/${attachmentId}`,
      this.getAuthHeaders(),
    );
  }

  uploadJobPhotos(jobId: string, files: File[], message?: string): Observable<unknown> {
    const formData = new FormData();
    formData.append('Type', '2'); // JobUpdateType.Photo
    if (message) {
      formData.append('Message', message);
    }
    files.forEach((file) => formData.append('Attachments', file));

    return this.api.postFormWithHeaders(
      `${this.baseUrl}/jobs/${jobId}/updates`,
      formData,
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

  createDepositPayment(invoiceId: string, amount: number): Observable<ClientHubDepositResponse> {
    return this.api.postWithHeaders<ClientHubDepositResponse>(
      `payments/deposit`,
      { invoiceId, amount, productName: 'Deposit' },
      this.getAuthHeaders(),
    );
  }

  getOrganizationBranding(organizationId: string): Observable<OrganizationBranding> {
    return this.api.get<OrganizationBranding>(`OrganizationBranding/${organizationId}`);
  }

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.auth.getToken();
    if (!token) return undefined;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private normalizeCollection<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (response && typeof response === 'object') {
      const source = response as Record<string, unknown>;
      const candidates: unknown[] = [
        source['items'],
        source['data'],
        source['value'],
        source['result'],
        response,
      ];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate as T[];
        }

        if (candidate && typeof candidate === 'object' && 'id' in (candidate as Record<string, unknown>)) {
          return [candidate as T];
        }
      }
    }

    return [];
  }

  private normalizeItem<T>(response: unknown): T {
    if (response && typeof response === 'object') {
      const source = response as Record<string, unknown>;
      const candidates: unknown[] = [
        source['data'],
        source['value'],
        source['result'],
        response,
      ];

      for (const candidate of candidates) {
        if (candidate && typeof candidate === 'object' && 'id' in (candidate as Record<string, unknown>)) {
          return candidate as T;
        }
      }
    }

    return response as T;
  }
}
