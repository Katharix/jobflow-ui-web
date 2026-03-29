import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/shared/base-api.service';
import {
  CreateEstimateRequest,
  Estimate,
  SendEstimateRequest,
  UpdateEstimateRequest,
} from '../models/estimate';

@Injectable({ providedIn: 'root' })
export class EstimateService {
  private api = inject(BaseApiService);

  private readonly baseUrl = 'estimates';

  getById(id: string): Observable<Estimate> {
    return this.api.get<Estimate>(`${this.baseUrl}/${id}`);
  }

  getByOrganization(): Observable<Estimate[]> {
    return this.api.get<Estimate[]>(`${this.baseUrl}/organization`);
  }

  create(request: CreateEstimateRequest): Observable<Estimate> {
    return this.api.post<Estimate>(this.baseUrl, request);
  }

  update(id: string, request: UpdateEstimateRequest): Observable<Estimate> {
    return this.api.put<Estimate>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  send(id: string, request: SendEstimateRequest): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${id}/send`, request);
  }

  getPublic(token: string): Observable<Estimate> {
    return this.api.get<Estimate>(`${this.baseUrl}/public/${token}`);
  }

  getPublicPdf(token: string): Observable<Blob> {
    return this.api.getBlob(`${this.baseUrl}/public/${token}/pdf`);
  }
}
