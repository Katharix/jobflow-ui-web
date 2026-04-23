import { Injectable, inject, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

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
  private readonly ngZone = inject(NgZone);
  private hubConnection: signalR.HubConnection | null = null;

  private ensureConnection(): signalR.HubConnection {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/client-portal`, {
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .build();
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
      await this.ngZone.runOutsideAngular(() => connection.start());
    } catch {
      /* connection is optional — pages work without real-time updates */
    }
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

    try {
      await this.ngZone.runOutsideAngular(() => this.hubConnection!.stop());
    } catch {
      /* best-effort teardown */
    }
  }
}
