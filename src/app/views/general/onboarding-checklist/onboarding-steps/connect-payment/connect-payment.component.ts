import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../../../services/shared/payment.service';
import { OrganizationContextService } from '../../../../../services/shared/organization-context.service';
import { PaymentProviders } from '../data';
import { CommonModule } from '@angular/common';
import { PaymentProvider } from '../../../../../models/customer-payment-profile';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-connect-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connect-payment.component.html',
  styleUrl: './connect-payment.component.scss'
})
export class ConnectPaymentComponent implements OnInit {
  orgId: string | undefined;
  paymentProviders = PaymentProviders;
  private callbackHandled = false;
  callbackStatus: 'processing' | 'success' | 'error' | null = null;
  callbackMessage = '';
  callbackProvider: 'Stripe' | 'Square' | null = null;

  constructor(
    private paymentService: PaymentService,
    private orgContext: OrganizationContextService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.handleProviderCallback();

    this.orgContext.org$.subscribe(org => {
      if (org) {
        this.orgId = org.id;
        this.handleProviderCallback();
      }
    });
  }

  private handleProviderCallback() {
    if (this.callbackHandled) {
      return;
    }

    const provider = (this.route.snapshot.queryParamMap.get('provider') ?? '').toLowerCase();
    const success = (this.route.snapshot.queryParamMap.get('success') ?? '').toLowerCase() === 'true';
    const callbackError = this.route.snapshot.queryParamMap.get('error');

    if (provider !== 'square' && provider !== 'stripe') {
      return;
    }

    this.callbackHandled = true;
    this.callbackProvider = provider === 'square' ? 'Square' : 'Stripe';

    if (!success || callbackError) {
      this.callbackStatus = 'error';
      this.callbackMessage = `${this.callbackProvider} connection was not completed. Please try again.`;
      this.clearCallbackQueryParams();
      return;
    }

    if (provider === 'stripe') {
      this.callbackStatus = 'success';
      this.callbackMessage = 'Stripe account connected successfully. You can now accept payments.';
      this.clearCallbackQueryParams();
      return;
    }

    if (!this.orgId) {
      this.callbackHandled = false;
      return;
    }

    const merchantId = this.route.snapshot.queryParamMap.get('merchantId');

    if (!merchantId) {
      this.callbackStatus = 'error';
      this.callbackMessage = 'Square authorization completed, but merchant id was missing.';
      this.clearCallbackQueryParams();
      return;
    }

    this.callbackStatus = 'processing';
    this.callbackMessage = 'Finalizing Square connection...';

    this.paymentService.linkConnectedAccount({
      accountId: merchantId,
      provider: PaymentProvider.Square
    }).subscribe({
      next: () => {
        this.callbackStatus = 'success';
        this.callbackMessage = 'Square account connected successfully. You can now accept payments.';
        this.clearCallbackQueryParams();
      },
      error: () => {
        this.callbackStatus = 'error';
        this.callbackMessage = 'Square authorization succeeded, but account linking failed. Please try again.';
        this.clearCallbackQueryParams();
      }
    });
  }

  private clearCallbackQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  createConnectedAccount(provider: 'Stripe' | 'Square') {
    const selectedProvider = provider === 'Square' ? PaymentProvider.Square : PaymentProvider.Stripe;

    this.paymentService.createConnectedAccount(selectedProvider).subscribe({
      next: onboardingUrl => {
        window.location.href = onboardingUrl.onboarding;
      },
      error: err => {
      }
    });
  }
}
