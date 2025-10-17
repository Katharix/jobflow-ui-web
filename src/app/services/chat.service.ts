import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';



@Injectable({ providedIn: 'root' })
export class ChatService {
  private hubConnection!: signalR.HubConnection;

  constructor() {}

  startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/chat`) // ensure no double slash
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

  sendMessage(conversationId: string, message: any): void {
    this.hubConnection.invoke('SendMessage', conversationId, message);
  }

  onMessageReceived(callback: (message: any) => void): void {
    this.hubConnection.on('ReceiveMessage', callback);
  }
}
