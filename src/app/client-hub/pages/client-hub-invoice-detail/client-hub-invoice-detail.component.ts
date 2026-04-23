
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { Invoice, InvoiceStatus } from '../../../models/invoice';
import { PaymentProvider } from '../../../models/customer-payment-profile';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';
import { OrganizationBranding } from '../../models/client-hub.models';
import { environment } from '../../../../environments/environment';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { ClientHubNotifierService, ClientHubInvoicePaidEvent } from '../../services/client-hub-notifier.service';

@Component({
  selector: 'app-client-hub-invoice-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-hub-invoice-detail.component.html',
  styleUrl: './client-hub-invoice-detail.component.scss',
})
export class ClientHubInvoiceDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly http = inject(HttpClient);
  private readonly notifier = inject(ClientHubNotifierService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly requestTimeoutMs = 15000;
  private readonly invoicePaidHandler = (payload: ClientHubInvoicePaidEvent) => {
    if (payload.invoiceId === this.invoice?.id) {
      this.loadInvoice();
    }
  };

  isLoading = true;
  isPaying = false;
  isConfirming = false;
  error: string | null = null;
  paymentError: string | null = null;
  invoice: Invoice | null = null;
  branding: OrganizationBranding | null = null;
  showPaymentForm = false;
  private stripe?: Stripe | null;
  private elements?: StripeElements;
  @ViewChild('paymentElementContainer') paymentElementContainer?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.loadInvoice();
    this.notifier.onInvoicePaid(this.invoicePaidHandler);
    this.notifier.startConnection();
  }

  ngOnDestroy(): void {
    this.notifier.offInvoicePaid(this.invoicePaidHandler);
    this.notifier.stopConnection();
  }

  get canPay(): boolean {
    if (!this.invoice || this.isPaying || this.isConfirming) return false;

    const status = this.resolveStatus(this.invoice.status);
    const balanceDue = Number(this.invoice.balanceDue ?? 0);

    return status !== InvoiceStatus.Paid && balanceDue > 0;
  }

  get paymentProvider(): PaymentProvider {
    const raw = this.invoice?.paymentProvider as PaymentProvider | string | undefined;
    if (raw === PaymentProvider.Stripe || raw === PaymentProvider.Square) return raw;
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      if (normalized === 'square') return PaymentProvider.Square;
      if (normalized === 'stripe') return PaymentProvider.Stripe;
    }
    return PaymentProvider.Stripe;
  }

  get paymentProviderLabel(): string {
    return this.paymentProvider === PaymentProvider.Square ? 'Square' : 'Stripe';
  }

  get payButtonLabel(): string {
    return this.paymentProvider === PaymentProvider.Square ? 'Pay with Square' : 'Pay Invoice';
  }

  get statusLabel(): string {
    if (!this.invoice) return 'Unknown';

    const labels: Record<number, string> = {
      [InvoiceStatus.Draft]: 'Draft',
      [InvoiceStatus.Sent]: 'Unpaid',
      [InvoiceStatus.Paid]: 'Paid',
      [InvoiceStatus.Overdue]: 'Overdue',
      [InvoiceStatus.Unpaid]: 'Unpaid',
    };

    const resolved = this.resolveStatus(this.invoice.status);
    return labels[resolved] ?? 'Unknown';
  }

  get isPaid(): boolean {
    if (!this.invoice) return false;
    return this.resolveStatus(this.invoice.status) === InvoiceStatus.Paid;
  }

  get balanceDueClass(): string {
    return this.isPaid ? 'amount-positive' : 'amount-negative';
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
        return 'is-unpaid';
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
    this.showPaymentForm = false;

    if (this.invoice.balanceDue > 999_999.99) {
      this.paymentError = 'Payment amount must be no more than $999,999.99.';
      this.isPaying = false;
      return;
    }

    if (!this.clientHubAuth.hasToken()) {
      this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
      return;
    }

    const provider = this.paymentProvider;

    this.http
      .post<{ url?: string; clientSecret?: string }>(
        `${environment.apiUrl.replace(/\/$/, '')}/payments/checkout`,
        { invoiceId: this.invoice.id },
        { withCredentials: true },
      )
      .subscribe({
      next: (result) => {
        this.isPaying = false;

        if (result?.url) {
          window.location.href = result.url;
          return;
        }

        if (result?.clientSecret && provider === PaymentProvider.Stripe) {
          this.initializeStripePayment(result.clientSecret);
          return;
        }

        if (provider === PaymentProvider.Square) {
          this.paymentError = 'Square checkout is unavailable right now. Please try again.';
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

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.isConfirming = true;
    this.paymentError = null;

    try {
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (result.error) {
        this.paymentError = result.error.message ?? 'Payment failed.';
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        this.showPaymentForm = false;
        this.loadInvoice();
      }
    } catch {
      this.paymentError = 'Unable to confirm payment right now.';
    } finally {
      this.isConfirming = false;
      this.cdr.detectChanges();
    }
  }

  cancelPayment(): void {
    this.showPaymentForm = false;
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

    this.clientHubService.getInvoiceById(id).pipe(
      timeout(this.requestTimeoutMs),
    ).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadBranding(invoice.organizationId);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        if (this.isAuthError(error)) {
          this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
          return;
        }

        this.error = 'Unable to load this invoice right now.';
      },
    });
  }

  private isAuthError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse
      && (error.status === 401 || error.status === 403);
  }

  private loadBranding(organizationId: string): void {
    this.clientHubService.getOrganizationBranding(organizationId).subscribe({
      next: (branding) => {
        this.branding = branding;
        this.cdr.detectChanges();
      },
      error: () => {
        // branding is optional — page still works without it
      },
    });
  }

  get orgDisplayName(): string {
    return this.branding?.businessName?.trim()
      || this.invoice?.organizationClient?.organization?.organizationName?.trim()
      || '';
  }

  private async initializeStripePayment(clientSecret: string): Promise<void> {
    if (this.paymentProvider !== PaymentProvider.Stripe) {
      this.paymentError = 'Stripe checkout is not available for this invoice.';
      return;
    }

    try {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        this.paymentError = 'Unable to initialize Stripe.';
        return;
      }

      this.elements = this.stripe.elements({ clientSecret });
      this.showPaymentForm = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        if (!this.elements || !this.paymentElementContainer?.nativeElement) return;
        const element = this.elements.create('payment');
        element.mount(this.paymentElementContainer.nativeElement);
      });
    } catch {
      this.paymentError = 'Unable to initialize payment.';
    }
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
