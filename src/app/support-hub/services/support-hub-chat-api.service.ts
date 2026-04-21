import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { SupportChatMessageDto } from './support-hub-signalr.service';

// ---------------------------------------------------------------------------
// Request / Response models
// ---------------------------------------------------------------------------

export interface SupportChatJoinQueueRequest {
  customerName: string;
  customerEmail: string;
  accessCode?: string;
}

export interface SupportChatJoinQueueResponse {
  sessionId: string;
  queuePosition: number;
  estimatedWaitSeconds: number;
}

export interface SupportChatQueueItemDto {
  sessionId: string;
  customerName: string;
  customerEmail: string;
  queuePosition: number;
  estimatedWaitSeconds: number;
  joinedAt: string;
}

export interface SupportChatSessionDto {
  id: string;
  customerName: string;
  customerEmail: string;
  customerId: string | null;
  assignedRepId: string | null;
  assignedRepName: string | null;
  status: string;
  createdAt: string;
  startedAt: string | null;
  closedAt: string | null;
  estimatedWaitSeconds: number;
  queuePosition: number;
}

export interface SupportChatSendMessageRequest {
  sessionId: string;
  senderId: string | null;
  senderName: string;
  senderRole: number; // 0 = Customer, 1 = Rep
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export interface SupportChatFileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export interface SupportChatValidateCustomerResponse {
  isValid: boolean;
  userId: string | null;
  displayName: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class SupportHubChatApiService {
  private api = inject(BaseApiService);
  private readonly apiUrl = 'supporthub/chat';

  joinQueue(request: SupportChatJoinQueueRequest): Observable<SupportChatJoinQueueResponse> {
    return this.api.post<SupportChatJoinQueueResponse>(`${this.apiUrl}/queue/join`, request);
  }

  getQueue(): Observable<SupportChatQueueItemDto[]> {
    return this.api.get<SupportChatQueueItemDto[]>(`${this.apiUrl}/queue`);
  }

  pickCustomer(sessionId: string): Observable<SupportChatSessionDto> {
    return this.api.post<SupportChatSessionDto>(`${this.apiUrl}/sessions/${sessionId}/pick`, {});
  }

  getMessages(sessionId: string): Observable<SupportChatMessageDto[]> {
    return this.api.get<SupportChatMessageDto[]>(`${this.apiUrl}/sessions/${sessionId}/messages`);
  }

  sendMessage(request: SupportChatSendMessageRequest): Observable<SupportChatMessageDto> {
    return this.api.post<SupportChatMessageDto>(`${this.apiUrl}/messages`, request);
  }

  uploadFile(sessionId: string, file: File): Observable<SupportChatFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormWithHeaders<SupportChatFileUploadResponse>(`${this.apiUrl}/sessions/${sessionId}/upload`, formData);
  }

  closeSession(sessionId: string): Observable<void> {
    return this.api.post<void>(`${this.apiUrl}/sessions/${sessionId}/close`, {});
  }

  validateCustomer(email: string): Observable<SupportChatValidateCustomerResponse> {
    return this.api.get<SupportChatValidateCustomerResponse>(`${this.apiUrl}/auth/validate?email=${encodeURIComponent(email)}`);
  }

  getSession(sessionId: string): Observable<SupportChatSessionDto> {
    return this.api.get<SupportChatSessionDto>(`${this.apiUrl}/sessions/${sessionId}`);
  }

  removeFromQueue(sessionId: string): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/sessions/${sessionId}/queue`);
  }
}
