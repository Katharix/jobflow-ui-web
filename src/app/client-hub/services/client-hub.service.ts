import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import {
  ClientHubEstimate,
  ClientHubInvoice,
  ClientHubProfile,
  ClientHubWorkRequest,
  ClientHubWorkRequestResponse,
  UpdateClientHubProfileRequest,
} from '../models/client-hub.models';

@Injectable({ providedIn: 'root' })
export class ClientHubService {
  private readonly api = inject(BaseApiService);
  private readonly baseUrl = 'client-hub';

  getMe(): Observable<ClientHubProfile> {
    return this.api.get<ClientHubProfile>(`${this.baseUrl}/me`);
  }

  updateMe(request: UpdateClientHubProfileRequest): Observable<ClientHubProfile> {
    return this.api.put<ClientHubProfile>(`${this.baseUrl}/me`, request);
  }

  getEstimates(): Observable<ClientHubEstimate[]> {
    return this.api.get<ClientHubEstimate[]>(`${this.baseUrl}/estimates`);
  }

  getEstimateById(id: string): Observable<ClientHubEstimate> {
    return this.api.get<ClientHubEstimate>(`${this.baseUrl}/estimates/${id}`);
  }

  acceptEstimate(id: string): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/estimates/${id}/accept`, {});
  }

  declineEstimate(id: string): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/estimates/${id}/decline`, {});
  }

  getInvoices(): Observable<ClientHubInvoice[]> {
    return this.api.get<ClientHubInvoice[]>(`${this.baseUrl}/invoices`);
  }

  getInvoiceById(id: string): Observable<ClientHubInvoice> {
    return this.api.get<ClientHubInvoice>(`${this.baseUrl}/invoices/${id}`);
  }

  requestWork(request: ClientHubWorkRequest): Observable<ClientHubWorkRequestResponse> {
    return this.api.post<ClientHubWorkRequestResponse>(`${this.baseUrl}/work-requests`, request);
  }
}
