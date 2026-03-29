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

  private ensureConnection(): signalR.HubConnection {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/client-chat`, {
          accessTokenFactory: async () => this.authService.getToken() ?? '',
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.onreconnected(async () => {
        if (this.activeConversationId) {
          await this.joinConversation(this.activeConversationId);
        }
      });
    }

    return this.hubConnection;
  }

  async startConnection(): Promise<void> {
    const connection = this.ensureConnection();

    if (connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    await connection.start();

    if (this.activeConversationId) {
      await this.joinConversation(this.activeConversationId);
    }
  }

  joinConversation(conversationId: string): Promise<void> {
    this.activeConversationId = conversationId;
    const connection = this.ensureConnection();
    return connection.invoke('JoinConversation', conversationId);
  }

  leaveConversation(conversationId: string): Promise<void> {
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    const connection = this.ensureConnection();
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
    return connection.invoke('Typing', conversationId, isTyping);
  }

  async stopConnection(): Promise<void> {
    if (!this.hubConnection) return;

    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      return;
    }

    await this.hubConnection.stop();
  }
}
