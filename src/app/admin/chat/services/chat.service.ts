import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  private auth = inject(Auth);

  startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/chat`, {
        accessTokenFactory: async () => {
          const token = await this.auth.currentUser?.getIdToken();
          return token ?? '';
        }
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch(err => console.error('SignalR connection error:', err));
  }

  joinConversation(conversationId: string): void {
    this.hubConnection.invoke('JoinConversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.hubConnection.invoke('LeaveConversation', conversationId);
  }

  sendMessage(conversationId: string, message: Record<string, unknown>): void {
    this.hubConnection.invoke('SendMessage', conversationId, message);
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.hubConnection.invoke('Typing', conversationId, isTyping);
  }

  onMessageReceived(callback: (message: Record<string, unknown>) => void): void {
    this.hubConnection.on('ReceiveMessage', callback);
  }

  onSmsStatus(callback: (status: Record<string, unknown>) => void): void {
    this.hubConnection.on('SmsStatus', callback);
  }

  onTyping(callback: (payload: Record<string, unknown>) => void): void {
    this.hubConnection.on('Typing', callback);
  }

  onReadReceipt(callback: (payload: Record<string, unknown>) => void): void {
    this.hubConnection.on('ReadReceipt', callback);
  }
}
