
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, throwError, timeout } from 'rxjs';
import { InvoiceStatus } from '../../../models/invoice';
import { ClientHubInvoice } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

@Component({
  selector: 'app-client-hub-invoices',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-hub-invoices.component.html',
  styleUrl: './client-hub-invoices.component.scss',
})
export class ClientHubInvoicesComponent implements OnInit {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly requestTimeoutMs = 15000;

  isLoading = true;
  error: string | null = null;
  items: ClientHubInvoice[] = [];

  ngOnInit(): void {
    this.load();
  }

  statusLabel(status: InvoiceStatus | number | string): string {
    const normalized = this.resolveStatus(status);

    const map: Record<number, string> = {
      [InvoiceStatus.Draft]: 'Draft',
      [InvoiceStatus.Sent]: 'Unpaid',
      [InvoiceStatus.Paid]: 'Paid',
      [InvoiceStatus.Overdue]: 'Overdue',
      [InvoiceStatus.Unpaid]: 'Unpaid',
    };

    return map[normalized] ?? 'Unknown';
  }

  statusClass(status: InvoiceStatus | number | string): string {
    const normalized = this.resolveStatus(status);

    switch (normalized) {
      case InvoiceStatus.Paid:
        return 'is-paid';
      case InvoiceStatus.Overdue:
        return 'is-overdue';
      case InvoiceStatus.Unpaid:
        return 'is-unpaid';
      case InvoiceStatus.Sent:
        return 'is-unpaid';
      default:
        return 'is-draft';
    }
  }

  private resolveStatus(status: InvoiceStatus | number | string): number {
    if (typeof status === 'number') return status;

    const asNumber = Number(status);
    if (!Number.isNaN(asNumber)) return asNumber;

    const stringMap: Record<string, InvoiceStatus> = {
      draft: InvoiceStatus.Draft,
      sent: InvoiceStatus.Sent,
      paid: InvoiceStatus.Paid,
      overdue: InvoiceStatus.Overdue,
      unpaid: InvoiceStatus.Unpaid,
    };

    return stringMap[String(status).toLowerCase()] ?? -1;
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

    this.clientHubService.getInvoices().pipe(
      timeout(this.requestTimeoutMs),
      catchError((error: unknown) => {
        if (this.isAuthError(error)) return throwError(() => error);
        this.error = 'Unable to load your invoices at this time.';
        return of([] as ClientHubInvoice[]);
      }),
      finalize(() => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }),
    ).subscribe({
      next: (response) => {
        const items = this.normalizeInvoices(response);

        this.ngZone.run(() => {
          this.items = [...items].sort((left, right) => {
            const leftDate = new Date(left.invoiceDate ?? 0).getTime();
            const rightDate = new Date(right.invoiceDate ?? 0).getTime();
            return rightDate - leftDate;
          });
          this.cdr.detectChanges();
        });
      },
      error: (error: HttpErrorResponse) => {
        if (this.isAuthError(error)) {
          this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/invoices');
          return;
        }

        this.error = 'Unable to load your invoices at this time.';
      },
    });
  }

  private isAuthError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse
      && (error.status === 401 || error.status === 403);
  }

  private normalizeInvoices(response: unknown): ClientHubInvoice[] {
    if (Array.isArray(response)) {
      return response as ClientHubInvoice[];
    }

    if (response && typeof response === 'object') {
      const source = response as Record<string, unknown>;
      const candidates: unknown[] = [
        source['items'],
        source['data'],
        source['value'],
        source['result'],
        response,
      ];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate as ClientHubInvoice[];
        }

        if (candidate && typeof candidate === 'object' && 'id' in (candidate as Record<string, unknown>)) {
          return [candidate as ClientHubInvoice];
        }
      }
    }

    return [];
  }
}
