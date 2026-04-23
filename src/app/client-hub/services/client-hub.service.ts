import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { environment } from '../../../environments/environment';
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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'client-hub';
  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');

  getMe(): Observable<ClientHubProfile> {
    return this.api.get<ClientHubProfile>(`${this.baseUrl}/me`);
  }

  updateMe(request: UpdateClientHubProfileRequest): Observable<ClientHubProfile> {
    return this.api.put<ClientHubProfile>(`${this.baseUrl}/me`, request);
  }

  getEstimates(): Observable<ClientHubEstimate[]> {
    return this.api.get<unknown>(
      `${this.baseUrl}/estimates`,
    ).pipe(map((response) => this.normalizeCollection<ClientHubEstimate>(response)));
  }

  getEstimateById(id: string): Observable<ClientHubEstimate> {
    return this.api.get<unknown>(
      `${this.baseUrl}/estimates/${id}`,
    ).pipe(map((response) => this.normalizeItem<ClientHubEstimate>(response)));
  }

  acceptEstimate(id: string): Observable<void> {
    return this.api.post<void>(
      `${this.baseUrl}/estimates/${id}/accept`,
      {},
    );
  }

  declineEstimate(id: string): Observable<void> {
    return this.api.post<void>(
      `${this.baseUrl}/estimates/${id}/decline`,
      {},
    );
  }

  getInvoices(): Observable<ClientHubInvoice[]> {
    return this.api.get<unknown>(
      `${this.baseUrl}/invoices`,
    ).pipe(map((response) => this.normalizeCollection<ClientHubInvoice>(response)));
  }

  getInvoiceById(id: string): Observable<ClientHubInvoice> {
    return this.api.get<unknown>(
      `${this.baseUrl}/invoices/${id}`,
    ).pipe(map((response) => this.normalizeItem<ClientHubInvoice>(response)));
  }

  getJobs(): Observable<ClientHubJobSummary[]> {
    return this.api.get<unknown>(
      `${this.baseUrl}/jobs`,
    ).pipe(map((response) => this.normalizeCollection<ClientHubJobSummary>(response)));
  }

  getJobById(id: string): Observable<ClientHubJobSummary> {
    return this.api.get<unknown>(
      `${this.baseUrl}/jobs/${id}`,
    ).pipe(map((response) => this.normalizeItem<ClientHubJobSummary>(response)));
  }

  getJobTimeline(id: string): Observable<ClientHubTimelineItem[]> {
    return this.api.get<unknown>(
      `${this.baseUrl}/jobs/${id}/timeline`,
    ).pipe(map((response) => this.normalizeCollection<ClientHubTimelineItem>(response)));
  }

  getJobUpdateAttachment(jobId: string, updateId: string, attachmentId: string): Observable<Blob> {
    return this.api.getBlob(
      `${this.baseUrl}/jobs/${jobId}/updates/${updateId}/attachments/${attachmentId}`,
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
    );
  }

  requestWork(request: ClientHubWorkRequest): Observable<ClientHubWorkRequestResponse> {
    return this.api.post<ClientHubWorkRequestResponse>(
      `${this.baseUrl}/work-requests`,
      request,
    );
  }

  createDepositPayment(invoiceId: string, amount: number): Observable<ClientHubDepositResponse> {
    return this.http.post<ClientHubDepositResponse>(
      `${this.apiUrl}/payments/deposit`,
      { invoiceId, amount, productName: 'Deposit' },
      { withCredentials: true },
    );
  }

  getOrganizationBranding(organizationId: string): Observable<OrganizationBranding> {
    return this.api.get<OrganizationBranding>(`OrganizationBranding/${organizationId}`);
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
