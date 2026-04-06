import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { ClientHubAuthService } from './client-hub-auth.service';
import { ClientHubChatMessage } from './client-hub-chat.service';

export interface ClientHubChatReadReceiptPayload {
  conversationId: string;
  messageIds: string[];
}

export interface ClientHubChatTypingPayload {
  conversationId: string;
  senderType?: string;
  isTyping?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClientHubChatRealtimeService {
  private readonly authService = inject(ClientHubAuthService);
  private hubConnection: signalR.HubConnection | null = null;
  private activeConversationId: string | null = null;

  private isConnected(connection: signalR.HubConnection): boolean {
    return connection.state === signalR.HubConnectionState.Connected;
  }

  private ensureConnection(): signalR.HubConnection {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/client-chat`, {
          accessTokenFactory: async () => this.authService.getToken() ?? '',
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.onreconnected(async () => {
        if (this.activeConversationId && this.hubConnection) {
          try {
            await this.hubConnection.invoke('JoinConversation', this.activeConversationId);
          } catch {
            // best effort rejoin after reconnect
          }
        }
      });
    }

    return this.hubConnection;
  }

  async startConnection(): Promise<void> {
    const connection = this.ensureConnection();

    if (connection.state === signalR.HubConnectionState.Connected
        || connection.state === signalR.HubConnectionState.Connecting
        || connection.state === signalR.HubConnectionState.Reconnecting) {
      return;
    }

    try {
      await connection.start();
    } catch {
      // connection is optional; callers can continue without realtime
      return;
    }

    if (this.activeConversationId) {
      try {
        await this.joinConversation(this.activeConversationId);
      } catch {
        // non-blocking if join fails
      }
    }
  }

  joinConversation(conversationId: string): Promise<void> {
    this.activeConversationId = conversationId;
    const connection = this.ensureConnection();

    if (!this.isConnected(connection)) {
      return Promise.resolve();
    }

    return connection.invoke('JoinConversation', conversationId);
  }

  leaveConversation(conversationId: string): Promise<void> {
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    const connection = this.ensureConnection();

    if (!this.isConnected(connection)) {
      return Promise.resolve();
    }

    return connection.invoke('LeaveConversation', conversationId);
  }

  onMessageReceived(callback: (message: ClientHubChatMessage) => void): void {
    this.ensureConnection().on('ReceiveMessage', callback);
  }

  onReadReceipt(callback: (payload: ClientHubChatReadReceiptPayload) => void): void {
    this.ensureConnection().on('ReadReceipt', callback);
  }

  onTyping(callback: (payload: ClientHubChatTypingPayload) => void): void {
    this.ensureConnection().on('Typing', callback);
  }

  sendTyping(conversationId: string, isTyping: boolean): Promise<void> {
    const connection = this.ensureConnection();

    if (!this.isConnected(connection)) {
      return Promise.resolve();
    }

    return connection.invoke('Typing', conversationId, isTyping);
  }

  async stopConnection(): Promise<void> {
    if (!this.hubConnection) return;

    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      return;
    }

    try {
      await this.hubConnection.stop();
    } catch {
      // best effort cleanup
    }
  }
}
