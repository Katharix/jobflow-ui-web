import { Component, OnInit, inject } from '@angular/core';
import { PaymentService } from '../../../../../services/shared/payment.service';
import { OrganizationContextService } from '../../../../../services/shared/organization-context.service';
import { PaymentProviders } from '../data';
import { CommonModule } from '@angular/common';
import { PaymentProvider } from '../../../../../models/customer-payment-profile';
import { OrganizationDto } from '../../../../../models/organization';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-connect-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connect-payment.component.html',
  styleUrl: './connect-payment.component.scss'
})
export class ConnectPaymentComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private orgContext = inject(OrganizationContextService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orgId: string | undefined;
  paymentProviders = PaymentProviders;
  private callbackHandled = false;
  callbackStatus: 'processing' | 'success' | 'error' | null = null;
  callbackMessage = '';
  callbackProvider: 'Stripe' | 'Square' | null = null;
  selectedProvider: 'Stripe' | 'Square' | null = null;
  isDisconnectingSquare = false;
  private currentOrg: OrganizationDto | null = null;

  ngOnInit(): void {
    this.handleProviderCallback();

    this.orgContext.org$.subscribe(org => {
      this.currentOrg = org;
      if (org) {
        this.orgId = org.id;
        this.setSelectedProviderFromOrg(org);
        this.handleProviderCallback();
      }
    });
  }

  private setSelectedProviderFromOrg(org: {
    paymentProvider?: PaymentProvider;
    stripeConnectedAccountId?: string;
    stripeConnectAccountId?: string;
    isStripeConnected?: boolean;
    isSquareConnected?: boolean;
    squareMerchantId?: string;
  }) {
    const isSquareConnected = !!(org.isSquareConnected && org.squareMerchantId);
    const isStripeConnected = !!(org.isStripeConnected || org.stripeConnectedAccountId || org.stripeConnectAccountId);

    if (isSquareConnected) {
      this.selectedProvider = 'Square';
      return;
    }

    if (isStripeConnected) {
      this.selectedProvider = 'Stripe';
      return;
    }

    this.selectedProvider = null;
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
      this.selectedProvider = 'Stripe';
      this.updateOrgProvider(PaymentProvider.Stripe);
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
        this.selectedProvider = 'Square';
        this.updateOrgProvider(PaymentProvider.Square);
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
    if (this.isProviderSelected(provider)) {
      return;
    }
    const selectedProvider = provider === 'Square' ? PaymentProvider.Square : PaymentProvider.Stripe;

    this.paymentService.createConnectedAccount(selectedProvider).subscribe({
      next: onboardingUrl => {
        if (onboardingUrl?.onboarding) {
          window.location.href = onboardingUrl.onboarding;
          return;
        }
        this.callbackStatus = 'error';
        this.callbackMessage = 'No onboarding link was returned. Please try again.';
      },
      error: (err: unknown) => {
        console.error(err);
      }
    });
  }

  isProviderSelected(provider: 'Stripe' | 'Square'): boolean {
    return this.selectedProvider === provider;
  }

  disconnectSquare() {
    if (this.isDisconnectingSquare || !this.currentOrg) {
      return;
    }

    const currentOrg = this.currentOrg;

    this.isDisconnectingSquare = true;
    this.callbackProvider = 'Square';
    this.callbackStatus = 'processing';
    this.callbackMessage = 'Disconnecting Square account...';

    this.paymentService.disconnectSquare().subscribe({
      next: () => {
        this.isDisconnectingSquare = false;
        this.callbackStatus = 'success';
        this.callbackMessage = 'Square account disconnected. You can reconnect anytime.';

        const hasStripeConnection = !!(
          this.currentOrg?.isStripeConnected ||
          this.currentOrg?.stripeConnectedAccountId ||
          this.currentOrg?.stripeConnectAccountId
        );

        this.selectedProvider = hasStripeConnection ? 'Stripe' : null;
        this.orgContext.setOrganization({
          ...currentOrg,
          isSquareConnected: false,
          squareMerchantId: undefined,
          canAcceptPayments: hasStripeConnection,
          paymentProvider: hasStripeConnection
            ? PaymentProvider.Stripe
            : currentOrg.paymentProvider
        });
      },
      error: () => {
        this.isDisconnectingSquare = false;
        this.callbackStatus = 'error';
        this.callbackMessage = 'Unable to disconnect Square right now. Please try again.';
      }
    });
  }

  private updateOrgProvider(provider: PaymentProvider) {
    if (!this.currentOrg) {
      return;
    }

    if (this.currentOrg.paymentProvider === provider) {
      return;
    }

    this.orgContext.setOrganization({
      ...this.currentOrg,
      paymentProvider: provider
    });
  }
}
