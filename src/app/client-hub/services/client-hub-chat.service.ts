import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';

export interface ClientHubChatConversation {
  id: string;
  name: string;
  status?: string;
  role?: string;
}

export interface ClientHubChatMessage {
  id: string;
  conversationId: string;
  content: string;
  attachmentUrl?: string | null;
  sentAt: string;
  senderName?: string | null;
  isMine: boolean;
  isRead?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'failed' | null;
}

@Injectable({ providedIn: 'root' })
export class ClientHubChatService {
  private readonly api = inject(BaseApiService);
  private readonly baseUrl = 'client-hub/chat';

  getConversation(): Observable<ClientHubChatConversation> {
    return this.api.get<ClientHubChatConversation>(`${this.baseUrl}/conversation`);
  }

  getMessages(conversationId: string, page = 1, pageSize = 50): Observable<ClientHubChatMessage[]> {
    return this.api.get<ClientHubChatMessage[]>(`${this.baseUrl}/messages`, {
      conversationId,
      page,
      pageSize,
    });
  }

  sendMessage(conversationId: string, content: string, attachmentUrl?: string | null): Observable<ClientHubChatMessage> {
    return this.api.post<ClientHubChatMessage>(`${this.baseUrl}/messages`, {
      conversationId,
      content,
      attachmentUrl: attachmentUrl ?? null,
    });
  }

  markRead(conversationId: string): Observable<{ updated: number }> {
    return this.api.post<{ updated: number }>(`${this.baseUrl}/read`, { conversationId });
  }
}
