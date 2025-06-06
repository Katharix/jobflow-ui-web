import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../../../services/payment.service';
import { OrganizationContextService } from '../../../../../services/shared/organization-context.service';
import { PaymentProviders } from '../data';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connect-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connect-payment.component.html',
  styleUrl: './connect-payment.component.scss'
})
export class ConnectPaymentComponent implements OnInit {
  orgId: string | undefined;
  paymentProviders = PaymentProviders
  constructor(
    private paymentService: PaymentService,
    private orgContext: OrganizationContextService
  ) { }

  ngOnInit(): void {
    this.orgContext.org$.subscribe(org => {
      if (org) {
        this.orgId = org.id;
      }
    });
  }

  createStripeConnectedAccount() {
    this.paymentService.createConnectedAccount(this.orgId!).subscribe({
      next: onboardingUrl => {
        window.location.href = onboardingUrl.onboarding;
      },
      error: err => {
      }
    });
  }
}
