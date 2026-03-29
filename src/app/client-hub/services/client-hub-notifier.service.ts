import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { ClientHubAuthService } from './client-hub-auth.service';

export interface ClientHubInvoicePaidEvent {
  invoiceId: string;
  organizationId: string;
  organizationClientId: string;
  status: number | string;
  balanceDue: number;
  amountPaid: number;
  paidAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientHubNotifierService {
  private readonly authService = inject(ClientHubAuthService);
  private hubConnection: signalR.HubConnection | null = null;

  private ensureConnection(): signalR.HubConnection {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/client-portal`, {
          accessTokenFactory: async () => this.authService.getToken() ?? '',
        })
        .withAutomaticReconnect()
        .build();
    }

    return this.hubConnection;
  }

  async startConnection(): Promise<void> {
    const connection = this.ensureConnection();
    if (connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    await connection.start();
  }

  onInvoicePaid(callback: (payload: ClientHubInvoicePaidEvent) => void): void {
    this.ensureConnection().on('InvoicePaid', callback);
  }

  offInvoicePaid(callback: (payload: ClientHubInvoicePaidEvent) => void): void {
    this.ensureConnection().off('InvoicePaid', callback);
  }

  async stopConnection(): Promise<void> {
    if (!this.hubConnection) return;

    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      return;
    }

    await this.hubConnection.stop();
  }
}
