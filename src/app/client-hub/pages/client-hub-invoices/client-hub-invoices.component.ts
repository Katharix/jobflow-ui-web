
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InvoiceStatus } from '../../../models/invoice';
import { ClientHubInvoice } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';
import { ClientHubNotifierService, ClientHubInvoicePaidEvent } from '../../services/client-hub-notifier.service';

@Component({
  selector: 'app-client-hub-invoices',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-hub-invoices.component.html',
  styleUrl: './client-hub-invoices.component.scss',
})
export class ClientHubInvoicesComponent implements OnInit, OnDestroy {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly notifier = inject(ClientHubNotifierService);
  private readonly invoicePaidHandler = (payload: ClientHubInvoicePaidEvent) => {
    this.applyInvoicePaid(payload);
  };

  isLoading = true;
  error: string | null = null;
  items: ClientHubInvoice[] = [];

  ngOnInit(): void {
    this.load();
    this.notifier.onInvoicePaid(this.invoicePaidHandler);
    void this.notifier.startConnection();
  }

  ngOnDestroy(): void {
    this.notifier.offInvoicePaid(this.invoicePaidHandler);
    void this.notifier.stopConnection();
  }

  statusLabel(status: InvoiceStatus | number): string {
    const map: Record<number, string> = {
      [InvoiceStatus.Draft]: 'Draft',
      [InvoiceStatus.Sent]: 'Sent',
      [InvoiceStatus.Paid]: 'Paid',
      [InvoiceStatus.Overdue]: 'Overdue',
      [InvoiceStatus.Unpaid]: 'Unpaid',
    };

    const key = Number(status);
    return map[key] ?? 'Unknown';
  }

  statusClass(status: InvoiceStatus | number): string {
    const key = Number(status);

    switch (key) {
      case InvoiceStatus.Paid:
        return 'is-paid';
      case InvoiceStatus.Overdue:
        return 'is-overdue';
      case InvoiceStatus.Unpaid:
        return 'is-unpaid';
      case InvoiceStatus.Sent:
        return 'is-sent';
      default:
        return 'is-draft';
    }
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value ?? 0);
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;

    this.clientHubService.getInvoices().subscribe({
      next: (items) => {
        this.items = [...(items ?? [])].sort((left, right) => {
          const leftDate = new Date(left.invoiceDate ?? 0).getTime();
          const rightDate = new Date(right.invoiceDate ?? 0).getTime();
          return rightDate - leftDate;
        });
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/invoices');
          return;
        }

        this.error = 'Unable to load your invoices at this time.';
      },
    });
  }

  private applyInvoicePaid(payload: ClientHubInvoicePaidEvent): void {
    const target = this.items.find(item => item.id === payload.invoiceId);
    if (!target) {
      return;
    }

    target.status = payload.status as InvoiceStatus;
    target.amountPaid = payload.amountPaid ?? target.amountPaid;
    target.balanceDue = payload.balanceDue ?? target.balanceDue;
    if (payload.paidAt) {
      target.paidAt = payload.paidAt;
    }
  }
}
