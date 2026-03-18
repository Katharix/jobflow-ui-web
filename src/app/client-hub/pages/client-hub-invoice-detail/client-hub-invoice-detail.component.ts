import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Invoice, InvoiceStatus } from '../../../models/invoice';
import { PaymentService } from '../../../services/shared/payment.service';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

@Component({
  selector: 'app-client-hub-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-hub-invoice-detail.component.html',
  styleUrl: './client-hub-invoice-detail.component.scss',
})
export class ClientHubInvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly paymentService = inject(PaymentService);

  isLoading = true;
  isPaying = false;
  error: string | null = null;
  paymentError: string | null = null;
  invoice: Invoice | null = null;

  ngOnInit(): void {
    this.loadInvoice();
  }

  get canPay(): boolean {
    if (!this.invoice || this.isPaying) return false;

    const status = this.resolveStatus(this.invoice.status);
    const balanceDue = Number(this.invoice.balanceDue ?? 0);

    return status !== InvoiceStatus.Paid && balanceDue > 0;
  }

  get statusLabel(): string {
    if (!this.invoice) return 'Unknown';

    const labels: Record<number, string> = {
      [InvoiceStatus.Draft]: 'Draft',
      [InvoiceStatus.Sent]: 'Sent',
      [InvoiceStatus.Paid]: 'Paid',
      [InvoiceStatus.Overdue]: 'Overdue',
      [InvoiceStatus.Unpaid]: 'Unpaid',
    };

    const resolved = this.resolveStatus(this.invoice.status);
    return labels[resolved] ?? 'Unknown';
  }

  statusClass(status: InvoiceStatus | number | string): string {
    switch (this.resolveStatus(status)) {
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

  lineItemAmount(item: { lineTotal?: number; quantity?: number; unitPrice?: number }): number {
    if (typeof item.lineTotal === 'number') return item.lineTotal;
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  payInvoice(): void {
    if (!this.invoice?.id || !this.canPay) return;

    this.isPaying = true;
    this.paymentError = null;

    this.paymentService.createInvoiceCheckoutSession(this.invoice.id).subscribe({
      next: (result) => {
        this.isPaying = false;

        if (result?.url) {
          window.location.href = result.url;
          return;
        }

        this.paymentError = 'Unable to open checkout right now. Please try again.';
      },
      error: (error: HttpErrorResponse) => {
        this.isPaying = false;

        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
          return;
        }

        this.paymentError = 'Unable to start payment. Please try again.';
      },
    });
  }

  private loadInvoice(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid invoice link.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.clientHubService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
          return;
        }

        this.error = 'Unable to load this invoice right now.';
      },
    });
  }

  private resolveStatus(status: InvoiceStatus | number | string): InvoiceStatus {
    if (typeof status === 'number') {
      return status as InvoiceStatus;
    }

    const parsed = Number(status);
    if (!Number.isNaN(parsed)) {
      return parsed as InvoiceStatus;
    }

    const normalized = String(status ?? '').trim().toLowerCase();
    switch (normalized) {
      case 'sent':
        return InvoiceStatus.Sent;
      case 'paid':
        return InvoiceStatus.Paid;
      case 'overdue':
        return InvoiceStatus.Overdue;
      case 'unpaid':
        return InvoiceStatus.Unpaid;
      default:
        return InvoiceStatus.Draft;
    }
  }
}
