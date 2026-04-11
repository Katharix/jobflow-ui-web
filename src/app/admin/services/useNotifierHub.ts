import { Auth } from '@angular/fire/auth';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

export interface EstimateRevisionRequestedEvent {
  estimateId: string;
  revisionRequestId: string;
  revisionNumber: number;
  requestedAt: string;
  message: string;
}

export interface JobStatusChangedEvent {
  jobId: string;
  jobTitle: string;
  status: number | string;
}

export interface AssignmentChangedEvent {
  jobId: string;
  assignmentId: string;
}

export interface EstimateStatusChangedEvent {
  estimateId: string;
  status: string;
}

export interface NotifierHubCallbacks {
  onEstimateRevisionRequested?: (payload: EstimateRevisionRequestedEvent) => void;
  onInvoicePaid?: (payload: InvoicePaidEvent) => void;
  onJobStatusChanged?: (payload: JobStatusChangedEvent) => void;
  onAssignmentChanged?: (payload: AssignmentChangedEvent) => void;
  onEstimateStatusChanged?: (payload: EstimateStatusChangedEvent) => void;
  onError?: (error: unknown) => void;
}

export interface InvoicePaidEvent {
  invoiceId: string;
  organizationId: string;
  organizationClientId: string;
  status: number | string;
  balanceDue: number;
  amountPaid: number;
  paidAt?: string;
}

export interface NotifierHubHandle {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useNotifierHub(auth: Auth, callbacks: NotifierHubCallbacks = {}): NotifierHubHandle {
  let connection: signalR.HubConnection | null = null;

  const connect = async (): Promise<void> => {
    try {
      if (!connection) {
        connection = new signalR.HubConnectionBuilder()
          .withUrl(`${environment.baseUrl.replace(/\/$/, '')}/hubs/notifier`, {
            accessTokenFactory: async () => (await auth.currentUser?.getIdToken()) ?? '',
          })
          .withAutomaticReconnect()
          .build();

        connection.on('EstimateRevisionRequested', (payload: EstimateRevisionRequestedEvent) => {
          callbacks.onEstimateRevisionRequested?.(payload);
        });

        connection.on('InvoicePaid', (payload: InvoicePaidEvent) => {
          callbacks.onInvoicePaid?.(payload);
        });

        connection.on('JobStatusChanged', (payload: JobStatusChangedEvent) => {
          callbacks.onJobStatusChanged?.(payload);
        });

        connection.on('AssignmentChanged', (payload: AssignmentChangedEvent) => {
          callbacks.onAssignmentChanged?.(payload);
        });

        connection.on('EstimateStatusChanged', (payload: EstimateStatusChangedEvent) => {
          callbacks.onEstimateStatusChanged?.(payload);
        });
      }

      if (connection.state === signalR.HubConnectionState.Disconnected) {
        await connection.start();
        await connection.invoke('JoinOrganizationDashboard');
      }
    } catch (error) {
      callbacks.onError?.(error);
    }
  };

  const disconnect = async (): Promise<void> => {
    if (!connection) {
      return;
    }

    try {
      if (connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('LeaveOrganizationDashboard');
      }
    } catch (error) {
      callbacks.onError?.(error);
    } finally {
      await connection.stop();
      connection = null;
    }
  };

  return { connect, disconnect };
}
