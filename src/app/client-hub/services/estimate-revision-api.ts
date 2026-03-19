import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseApiService } from '../../services/shared/base-api.service';
import { EstimateRevisionRequestDto } from '../models/client-hub.models';

@Injectable({ providedIn: 'root' })
export class EstimateRevisionApi {
  private readonly api = inject(BaseApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'client-hub';
  private readonly apiRoot = environment.apiUrl.replace(/\/$/, '');

  getRevisionRequests(estimateId: string): Observable<EstimateRevisionRequestDto[]> {
    return this.api.get<EstimateRevisionRequestDto[]>(
      `${this.baseUrl}/estimates/${estimateId}/revision-requests`,
    );
  }

  createRevisionRequest(
    estimateId: string,
    message: string,
    attachments: File[] = [],
  ): Observable<EstimateRevisionRequestDto> {
    const formData = new FormData();
    formData.append('Message', message);
    attachments.forEach((file) => formData.append('Attachments', file));

    return this.http.post<EstimateRevisionRequestDto>(
      `${this.apiRoot}/${this.baseUrl}/estimates/${estimateId}/revision-requests`,
      formData,
    );
  }

  downloadAttachment(
    estimateId: string,
    revisionRequestId: string,
    attachmentId: string,
  ): Observable<Blob> {
    return this.api.getBlob(
      `${this.baseUrl}/estimates/${estimateId}/revision-requests/${revisionRequestId}/attachments/${attachmentId}`,
    );
  }
}
