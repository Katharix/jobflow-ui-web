import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { PaymentService } from '../../../services/shared/payment.service';
import { ToastService } from '../../../common/toast/toast.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { OrganizationService } from '../../../services/shared/organization.service';
import { take } from 'rxjs';

type PlanKey = 'go' | 'flow' | 'max';
type BillingCycle = 'monthly' | 'yearly';

@Component({
  selector: 'app-subscription-required',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './subscription-required.component.html',
  styleUrl: './subscription-required.component.scss',
})
export class SubscriptionRequiredComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);
  private readonly toast = inject(ToastService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly organizationService = inject(OrganizationService);

  readonly required = this.route.snapshot.queryParamMap.get('required') ?? 'Go';
  readonly current = this.route.snapshot.queryParamMap.get('current') ?? 'None';
  readonly status = this.route.snapshot.queryParamMap.get('status') ?? 'unknown';

  providerSubscriptionId = '';
  selectedPlan: PlanKey = 'go';
  selectedCycle: BillingCycle = 'monthly';
  renewing = false;

  constructor() {
    this.paymentService.getCurrentSubscription().subscribe({
      next: (sub) => {
        this.providerSubscriptionId = sub.providerSubscriptionId;
        this.bootstrapSelectedPlanFromSubscription(sub.providerPriceId);
      }
    });
  }

  renewSubscription(): void {
    if (!this.providerSubscriptionId || this.renewing) {
      return;
    }

    const providerPriceId = this.resolvePriceId(this.selectedPlan, this.selectedCycle);
    if (!providerPriceId) {
      this.toast.error('Unable to resolve selected plan.', 'Renewal failed');
      return;
    }

    this.renewing = true;
    this.paymentService.changeSubscriptionPlan({
      providerSubscriptionId: this.providerSubscriptionId,
      providerPriceId,
    }).subscribe({
      next: () => {
        this.toast.success('Subscription renewed successfully.', 'Subscription renewed');
        this.renewing = false;
        this.refreshOrganizationContext();
      },
      error: () => {
        this.toast.error('Unable to renew subscription at this time.', 'Renewal failed');
        this.renewing = false;
      }
    });
  }

  private resolvePriceId(plan: PlanKey, cycle: BillingCycle): string {
    const stripe = environment.stripeSettings;
    if (plan === 'go' && cycle === 'monthly') return stripe.goMonthlyPrice;
    if (plan === 'go' && cycle === 'yearly') return stripe.goYearlyPrice;
    if (plan === 'flow' && cycle === 'monthly') return stripe.flowMonthlyPrice;
    if (plan === 'flow' && cycle === 'yearly') return stripe.flowYearlyPrice;
    if (plan === 'max' && cycle === 'monthly') return stripe.maxMonthlyPrice;
    if (plan === 'max' && cycle === 'yearly') return stripe.maxYearlyPrice;
    return '';
  }

  private bootstrapSelectedPlanFromSubscription(priceId: string): void {
    const stripe = environment.stripeSettings;
    if (!priceId) return;

    if (priceId === stripe.goMonthlyPrice) {
      this.selectedPlan = 'go';
      this.selectedCycle = 'monthly';
      return;
    }
    if (priceId === stripe.goYearlyPrice) {
      this.selectedPlan = 'go';
      this.selectedCycle = 'yearly';
      return;
    }
    if (priceId === stripe.flowMonthlyPrice) {
      this.selectedPlan = 'flow';
      this.selectedCycle = 'monthly';
      return;
    }
    if (priceId === stripe.flowYearlyPrice) {
      this.selectedPlan = 'flow';
      this.selectedCycle = 'yearly';
      return;
    }
    if (priceId === stripe.maxMonthlyPrice) {
      this.selectedPlan = 'max';
      this.selectedCycle = 'monthly';
      return;
    }
    if (priceId === stripe.maxYearlyPrice) {
      this.selectedPlan = 'max';
      this.selectedCycle = 'yearly';
    }
  }

  private refreshOrganizationContext(): void {
    this.orgContext.org$.pipe(take(1)).subscribe(org => {
      const orgId = org?.id;
      if (!orgId) return;
      this.organizationService.getOrganizationById({ organizationId: orgId }).subscribe({
        next: (latest) => {
          if (latest) this.orgContext.setOrganization(latest);
        }
      });
    });
  }
}
