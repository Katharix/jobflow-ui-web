import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { Auth } from '@angular/fire/auth';

// ---------------------------------------------------------------------------
// DTOs (mirror of backend SupportChatDtos)
// ---------------------------------------------------------------------------

export interface SupportChatMessageDto {
  id: string;
  sessionId: string;
  senderId: string | null;
  senderName: string;
  senderRole: number; // 0 = Customer, 1 = Rep
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  sentAt: string;
  isRead: boolean;
}

export interface SupportChatAgentJoinedEvent {
  agentName: string;
}

export interface SupportChatUserTypingEvent {
  senderName: string;
  isTyping: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class SupportHubSignalRService {
  private connection: HubConnection | null = null;
  private auth = inject(Auth);

  private messageSubject = new Subject<SupportChatMessageDto>();
  private queueUpdatedSubject = new Subject<void>();
  private agentJoinedSubject = new Subject<SupportChatAgentJoinedEvent>();
  private sessionClosedSubject = new Subject<void>();
  private userTypingSubject = new Subject<SupportChatUserTypingEvent>();

  readonly messages$ = this.messageSubject.asObservable();
  readonly queueUpdated$ = this.queueUpdatedSubject.asObservable();
  readonly agentJoined$ = this.agentJoinedSubject.asObservable();
  readonly sessionClosed$ = this.sessionClosedSubject.asObservable();
  readonly userTyping$ = this.userTypingSubject.asObservable();

  async startConnection(): Promise<void> {
    if (this.connection) return;

    const auth = this.auth;
    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/hubs/support-chat`, {
        accessTokenFactory: async () => {
          const user = auth.currentUser;
          if (!user) return '';
          return user.getIdToken();
        }
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('ReceiveMessage', (msg: SupportChatMessageDto) => {
      this.messageSubject.next(msg);
    });

    this.connection.on('QueueUpdated', () => {
      this.queueUpdatedSubject.next();
    });

    this.connection.on('AgentJoined', (payload: SupportChatAgentJoinedEvent) => {
      this.agentJoinedSubject.next(payload);
    });

    this.connection.on('SessionClosed', () => {
      this.sessionClosedSubject.next();
    });

    this.connection.on('UserTyping', (payload: SupportChatUserTypingEvent) => {
      this.userTypingSubject.next(payload);
    });

    await this.connection.start();
  }

  async joinSession(sessionId: string): Promise<void> {
    await this.connection?.invoke('JoinSession', sessionId);
  }

  async joinRepGroup(): Promise<void> {
    await this.connection?.invoke('JoinRepGroup');
  }

  async leaveSession(sessionId: string): Promise<void> {
    try { await this.connection?.invoke('LeaveSession', sessionId); } catch { /* ignore */ }
  }

  async sendMessage(sessionId: string, content: string): Promise<void> {
    await this.connection?.invoke('SendMessage', sessionId, content);
  }

  async startTyping(sessionId: string): Promise<void> {
    try { await this.connection?.invoke('StartTyping', sessionId); } catch { /* ignore */ }
  }

  async stopTyping(sessionId: string): Promise<void> {
    try { await this.connection?.invoke('StopTyping', sessionId); } catch { /* ignore */ }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try { await this.connection.stop(); } catch { /* ignore */ }
      this.connection = null;
    }
  }
}
