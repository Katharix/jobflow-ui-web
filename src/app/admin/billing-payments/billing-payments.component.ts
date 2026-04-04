import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';
import { Invoice, InvoiceStatus } from '../../models/invoice';
import { InvoiceService } from '../invoices/services/invoice.service';
import { ToastService } from '../../common/toast/toast.service';
import {
  FinancialSummary,
  PaymentHistoryItem,
  PaymentService
} from '../../services/shared/payment.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationService } from '../../services/shared/organization.service';
import { PaymentProvider } from '../../models/customer-payment-profile';

@Component({
  selector: 'app-billing-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, TranslateModule, FormsModule],
  templateUrl: './billing-payments.component.html',
  styleUrl: './billing-payments.component.scss'
})
export class BillingPaymentsComponent implements OnInit {
  private readonly eventPageSize = 25;

  private readonly invoiceService = inject(InvoiceService);
  private readonly paymentService = inject(PaymentService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly organizationService = inject(OrganizationService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  invoices: Invoice[] = [];
  history: PaymentHistoryItem[] = [];
  disputes: PaymentHistoryItem[] = [];
  financialSummary: FinancialSummary | null = null;

  historyNextCursor: string | null = null;
  disputeNextCursor: string | null = null;
  private historyCursorStack: string[] = [];
  private disputeCursorStack: string[] = [];
  historyLoading = false;
  disputesLoading = false;

  invoiceRefundAmounts: Record<string, number> = {};
  invoiceRefundReasons: Record<string, string> = {};
  refundingInvoiceId: string | null = null;

  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadInvoices();
    this.loadPaymentData();
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
        return this.translate.instant('admin.billing.status.draft');
      case InvoiceStatus.Sent:
        return this.translate.instant('admin.billing.status.sent');
      case InvoiceStatus.Paid:
        return this.translate.instant('admin.billing.status.paid');
      case InvoiceStatus.Overdue:
        return this.translate.instant('admin.billing.status.overdue');
      default:
        return this.translate.instant('admin.billing.status.unknown');
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
        this.toast.success(
          this.translate.instant('admin.billing.toast.invoiceSent'),
          this.translate.instant('admin.billing.toast.invoiceSentTitle')
        );
        this.loadInvoices();
      },
      error: () => {
        this.toast.error(
          this.translate.instant('admin.billing.toast.invoiceFailed'),
          this.translate.instant('admin.billing.toast.invoiceFailedTitle')
        );
      }
    });
  }

  sendReminder(invoice: Invoice): void {
    this.invoiceService.sendReminder(invoice.id).subscribe({
      next: () => {
        this.toast.success(
          this.translate.instant('admin.billing.toast.reminderSent'),
          this.translate.instant('admin.billing.toast.reminderSentTitle')
        );
      },
      error: () => {
        this.toast.error(
          this.translate.instant('admin.billing.toast.reminderFailed'),
          this.translate.instant('admin.billing.toast.reminderFailedTitle')
        );
      }
    });
  }

  get canGoBackHistory(): boolean {
    return this.historyCursorStack.length > 0;
  }

  get canGoBackDisputes(): boolean {
    return this.disputeCursorStack.length > 0;
  }

  toDollarFromMinor(amount: number): number {
    return amount / 100;
  }

  onIssueRefundForInvoice(invoice: Invoice): void {
    const providerPaymentId = this.getRefundPaymentId(invoice);
    if (!providerPaymentId || this.refundingInvoiceId) {
      return;
    }

    const enteredAmount = this.invoiceRefundAmounts[invoice.id];
    const amount = enteredAmount ?? invoice.amountPaid ?? invoice.totalAmount;
    if (!amount || amount <= 0) {
      this.toast.error('Enter a valid refund amount for this invoice.', 'Invalid refund request');
      return;
    }

    const provider = invoice.paymentProvider ?? this.currentProvider();
    this.refundingInvoiceId = invoice.id;

    this.paymentService.refundPayment({
      provider,
      invoiceId: invoice.id,
      providerPaymentId,
      amount,
      reason: this.invoiceRefundReasons[invoice.id]?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success(`Refund submitted for invoice ${invoice.invoiceNumber}.`, 'Refund submitted');
        this.refundingInvoiceId = null;
        this.loadInvoices();
        this.loadPaymentData();
      },
      error: () => {
        this.toast.error('Unable to submit refund right now.', 'Refund failed');
        this.refundingInvoiceId = null;
      }
    });
  }

  getRefundPaymentId(invoice: Invoice): string | null {
    const externalPaymentId = invoice.externalPaymentId?.trim();
    if (externalPaymentId) return externalPaymentId;

    const stripeInvoiceId = invoice.stripeInvoiceId?.trim();
    if (stripeInvoiceId) return stripeInvoiceId;

    return null;
  }

  canRefundInvoice(invoice: Invoice): boolean {
    return invoice.status === InvoiceStatus.Paid && !!this.getRefundPaymentId(invoice);
  }

  private currentProvider(): PaymentProvider {
    return PaymentProvider.Stripe;
  }

  private loadPaymentData(): void {
    this.paymentService.getFinancialSummary().subscribe({
      next: summary => this.financialSummary = summary,
      error: () => this.financialSummary = null,
    });

    this.historyCursorStack = [];
    this.disputeCursorStack = [];
    this.loadHistoryPage();
    this.loadDisputesPage();

    // Subscription actions are managed on the dedicated subscription page.
  }

  onNextHistoryPage(): void {
    if (!this.historyNextCursor || this.historyLoading) {
      return;
    }

    this.historyCursorStack.push(this.historyNextCursor);
    this.loadHistoryPage(this.historyNextCursor);
  }

  onPrevHistoryPage(): void {
    if (!this.canGoBackHistory || this.historyLoading) {
      return;
    }

    this.historyCursorStack.pop();
    const previousCursor = this.historyCursorStack.length > 0
      ? this.historyCursorStack[this.historyCursorStack.length - 1]
      : undefined;

    this.loadHistoryPage(previousCursor);
  }

  onNextDisputesPage(): void {
    if (!this.disputeNextCursor || this.disputesLoading) {
      return;
    }

    this.disputeCursorStack.push(this.disputeNextCursor);
    this.loadDisputesPage(this.disputeNextCursor);
  }

  onPrevDisputesPage(): void {
    if (!this.canGoBackDisputes || this.disputesLoading) {
      return;
    }

    this.disputeCursorStack.pop();
    const previousCursor = this.disputeCursorStack.length > 0
      ? this.disputeCursorStack[this.disputeCursorStack.length - 1]
      : undefined;

    this.loadDisputesPage(previousCursor);
  }

  private loadHistoryPage(cursor?: string): void {
    this.historyLoading = true;

    this.paymentService.getPaymentHistory(undefined, undefined, cursor, this.eventPageSize).subscribe({
      next: page => {
        this.history = page?.items ?? [];
        this.historyNextCursor = page?.nextCursor ?? null;
        this.historyLoading = false;
      },
      error: () => {
        this.history = [];
        this.historyNextCursor = null;
        this.historyLoading = false;
      },
    });
  }

  private loadDisputesPage(cursor?: string): void {
    this.disputesLoading = true;

    this.paymentService.getDisputes(undefined, undefined, cursor, this.eventPageSize).subscribe({
      next: page => {
        this.disputes = page?.items ?? [];
        this.disputeNextCursor = page?.nextCursor ?? null;
        this.disputesLoading = false;
      },
      error: () => {
        this.disputes = [];
        this.disputeNextCursor = null;
        this.disputesLoading = false;
      },
    });
  }

  private refreshOrganizationContext(): void {
    this.orgContext.org$.pipe(take(1)).subscribe(org => {
      const orgId = org?.id;
      if (!orgId) return;

      this.organizationService.getOrganizationById({ organizationId: orgId }).subscribe({
        next: (latest) => {
          if (latest) {
            this.orgContext.setOrganization(latest);
          }
        }
      });
    });
  }

  private loadInvoices(): void {
    this.loading = true;
    this.error = null;
    this.invoiceService.getByOrganization().subscribe({
      next: (invoices) => {
        this.invoices = invoices ?? [];
        const paidInvoices = this.invoices.filter(invoice => invoice.status === InvoiceStatus.Paid);
        this.invoiceRefundAmounts = Object.fromEntries(
          paidInvoices.map(invoice => [invoice.id, invoice.amountPaid || invoice.totalAmount])
        );
        this.loading = false;
      },
      error: () => {
        this.error = this.translate.instant('admin.billing.state.error');
        this.loading = false;
      }
    });
  }
}
