import { inject, Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
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
  private zone = inject(NgZone);
  private _isRepMode = false;

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
    if (this.connection) {
      if (this.connection.state === HubConnectionState.Disconnected) {
        await this.connection.start();
      }
      return;
    }

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

    this.connection.onreconnected(() => {
      if (this._isRepMode) {
        this.connection?.invoke('JoinRepGroup').catch(() => { /* ignore */ });
      }
    });

    this.connection.on('ReceiveMessage', (msg: SupportChatMessageDto) => {
      this.zone.run(() => this.messageSubject.next(msg));
    });

    this.connection.on('QueueUpdated', () => {
      this.zone.run(() => this.queueUpdatedSubject.next());
    });

    this.connection.on('AgentJoined', (payload: SupportChatAgentJoinedEvent) => {
      this.zone.run(() => this.agentJoinedSubject.next(payload));
    });

    this.connection.on('SessionClosed', () => {
      this.zone.run(() => this.sessionClosedSubject.next());
    });

    this.connection.on('UserTyping', (payload: SupportChatUserTypingEvent) => {
      this.zone.run(() => this.userTypingSubject.next(payload));
    });

    await this.connection.start();
  }

  async joinSession(sessionId: string): Promise<void> {
    await this.connection?.invoke('JoinSession', sessionId);
  }

  async joinRepGroup(): Promise<void> {
    this._isRepMode = true;
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
    this._isRepMode = false;
    if (this.connection) {
      try { await this.connection.stop(); } catch { /* ignore */ }
      this.connection = null;
    }
  }
}
