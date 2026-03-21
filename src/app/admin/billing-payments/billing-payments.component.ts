import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';
import { Invoice, InvoiceStatus } from '../../models/invoice';
import { InvoiceService } from '../invoices/services/invoice.service';
import { ToastService } from '../../common/toast/toast.service';

@Component({
  selector: 'app-billing-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './billing-payments.component.html',
  styleUrl: './billing-payments.component.scss'
})
export class BillingPaymentsComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);

  invoices: Invoice[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadInvoices();
  }

  get draftInvoices(): Invoice[] {
    return this.invoices.filter(invoice => invoice.status === InvoiceStatus.Draft);
  }

  get sentInvoices(): Invoice[] {
    return this.invoices.filter(invoice => invoice.status === InvoiceStatus.Sent);
  }

  get overdueInvoices(): Invoice[] {
    return this.invoices.filter(invoice => invoice.status === InvoiceStatus.Overdue);
  }

  get paidInvoices(): Invoice[] {
    return this.invoices.filter(invoice => invoice.status === InvoiceStatus.Paid);
  }

  get totalOutstanding(): number {
    return this.invoices
      .filter(invoice => invoice.status !== InvoiceStatus.Paid)
      .reduce((sum, invoice) => sum + (invoice.balanceDue ?? 0), 0);
  }

  get totalOverdue(): number {
    return this.overdueInvoices.length;
  }

  get totalDrafts(): number {
    return this.draftInvoices.length;
  }

  get totalSent(): number {
    return this.sentInvoices.length;
  }

  getStatusLabel(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Draft:
        return 'Draft';
      case InvoiceStatus.Sent:
        return 'Sent';
      case InvoiceStatus.Paid:
        return 'Paid';
      case InvoiceStatus.Overdue:
        return 'Overdue';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Paid:
        return 'badge bg-success';
      case InvoiceStatus.Overdue:
        return 'badge bg-danger';
      case InvoiceStatus.Sent:
        return 'badge bg-warning text-dark';
      case InvoiceStatus.Draft:
        return 'badge bg-secondary';
      default:
        return 'badge bg-secondary';
    }
  }

  openInvoice(invoice: Invoice): void {
    window.open(`/invoice/view/${invoice.id}`, '_blank');
  }

  sendInvoice(invoice: Invoice): void {
    this.invoiceService.sendInvoice(invoice.id).subscribe({
      next: () => {
        this.toast.success('Your invoice has been sent to the client.', 'Invoice sent');
        this.loadInvoices();
      },
      error: () => {
        this.toast.error('Unable to send the invoice right now.', 'Send failed');
      }
    });
  }

  sendReminder(invoice: Invoice): void {
    this.invoiceService.sendReminder(invoice.id).subscribe({
      next: () => {
        this.toast.success('A payment reminder was sent to the client.', 'Reminder sent');
      },
      error: () => {
        this.toast.error('Unable to send the reminder right now.', 'Reminder failed');
      }
    });
  }

  private loadInvoices(): void {
    this.loading = true;
    this.error = null;
    this.invoiceService.getByOrganization().subscribe({
      next: (invoices) => {
        this.invoices = invoices ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load billing details right now.';
        this.loading = false;
      }
    });
  }
}
