import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { plans } from '../../views/home/components/data';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';
import { ToastService } from '../../common/toast/toast.service';
import { PaymentService, CurrentSubscription } from '../../services/shared/payment.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationService } from '../../services/shared/organization.service';
import { environment } from '../../../environments/environment';
import { OrganizationDto } from '../../models/organization';

type PlanKey = 'go' | 'flow' | 'max';
type BillingCycle = 'monthly' | 'yearly';

interface PlanCard {
  key: PlanKey;
  title: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlights: string[];
}

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './subscription-management.component.html',
  styleUrl: './subscription-management.component.scss'
})
export class SubscriptionManagementComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly organizationService = inject(OrganizationService);
  private readonly toast = inject(ToastService);

  planCards: PlanCard[] = plans
    .filter((plan) => plan.name === 'Go' || plan.name === 'Flow' || plan.name === 'Max')
    .map((plan) => ({
      key: plan.name.toLowerCase() as PlanKey,
      title: plan.name,
      monthlyPrice: plan.price,
      yearlyPrice: plan.annualPrice,
      highlights: plan.features.slice(0, 2),
    }));

  organization: OrganizationDto | null = null;
  currentSubscription: CurrentSubscription | null = null;
  subscriptionStatus = '';
  subscriptionPlan = '';
  subscriptionExpiresAt = '';

  selectedPlan: PlanKey = 'go';
  selectedCycle: BillingCycle = 'monthly';
  currentPlan: PlanKey | null = null;
  currentCycle: BillingCycle | null = null;

  changingPlan = false;
  cancelingSubscription = false;
  creatingCheckout = false;
  refreshing = false;

  ngOnInit(): void {
    this.orgContext.org$.subscribe(org => {
      this.organization = org;
      this.subscriptionStatus = org?.subscriptionStatus ?? '';
      this.subscriptionPlan = org?.subscriptionPlanName ?? '';
      this.subscriptionExpiresAt = org?.subscriptionExpiresAt ?? '';
    });

    this.loadSubscription();
  }

  get canSelfServePlanChange(): boolean {
    return !!this.currentSubscription?.providerSubscriptionId?.startsWith('sub_');
  }

  get hasSubscription(): boolean {
    return !!this.currentSubscription?.providerSubscriptionId;
  }

  get isCanceled(): boolean {
    return (this.subscriptionStatus || this.currentSubscription?.status || '').toLowerCase() === 'canceled';
  }

  get canCancelSubscription(): boolean {
    const status = (this.subscriptionStatus || this.currentSubscription?.status || '').toLowerCase();
    return this.hasSubscription && status !== 'canceled';
  }

  get selectedPrice(): number {
    const plan = this.planCards.find(card => card.key === this.selectedPlan);
    if (!plan) return 0;
    return this.selectedCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  }

  get estimatedYearlySavings(): number {
    const plan = this.planCards.find(card => card.key === this.selectedPlan);
    if (!plan) return 0;
    return Math.max((plan.monthlyPrice * 12) - plan.yearlyPrice, 0);
  }

  get hasPendingSelectionChange(): boolean {
    if (!this.hasSubscription || !this.currentPlan || !this.currentCycle) {
      return false;
    }

    return this.selectedPlan !== this.currentPlan || this.selectedCycle !== this.currentCycle;
  }

  get currentStatusRaw(): string {
    return (this.subscriptionStatus || this.currentSubscription?.status || 'unknown').trim();
  }

  get isActiveLikeStatus(): boolean {
    const normalized = this.currentStatusRaw.toLowerCase();
    return normalized === 'active' || normalized === 'trialing';
  }

  get statusToneClass(): string {
    return this.isActiveLikeStatus
      ? 'status-chip status-chip--active'
      : 'status-chip status-chip--inactive';
  }

  get statusText(): string {
    const raw = this.currentStatusRaw;
    if (!raw) return 'Unknown';

    return raw
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  get saveButtonLabel(): string {
    if (this.changingPlan || this.creatingCheckout) {
      return 'Saving...';
    }

    if (!this.hasSubscription) {
      return 'Start Subscription';
    }

    return this.isCanceled ? 'Renew Subscription' : 'Change Plan';
  }

  onSaveSubscription(): void {
    if (!this.hasSubscription) {
      this.startSubscriptionCheckout();
      return;
    }

    this.onChangePlan();
  }

  onRenewCurrentPlan(): void {
    if (!this.currentSubscription?.providerPriceId) {
      this.toast.error('Current plan pricing could not be resolved.', 'Renewal unavailable');
      return;
    }

    const currentPriceId = this.currentSubscription.providerPriceId;
    this.selectedCycle = currentPriceId.endsWith('w3') || currentPriceId.endsWith('boy') || currentPriceId.endsWith('KHv')
      ? 'yearly'
      : this.selectedCycle;

    this.onChangePlan();
  }

  private onChangePlan(): void {
    if (!this.currentSubscription?.providerSubscriptionId || this.changingPlan) {
      return;
    }

    if (!this.canSelfServePlanChange) {
      this.toast.error('Plan changes for this provider currently require support assistance.', 'Plan update unavailable');
      return;
    }

    const providerPriceId = this.resolvePriceId(this.selectedPlan, this.selectedCycle);
    if (!providerPriceId) {
      this.toast.error('Unable to resolve the selected plan price.', 'Plan update failed');
      return;
    }

    this.changingPlan = true;
    this.paymentService.changeSubscriptionPlan({
      providerSubscriptionId: this.currentSubscription.providerSubscriptionId,
      providerPriceId,
    }).subscribe({
      next: () => {
        const action = this.isCanceled ? 'renewed' : 'updated';
        this.toast.success(`Subscription ${action} successfully.`, 'Subscription saved');
        this.changingPlan = false;
        this.loadSubscription();
        this.refreshOrganizationContext();
      },
      error: () => {
        this.toast.error('Unable to update subscription right now.', 'Subscription update failed');
        this.changingPlan = false;
      }
    });
  }

  onCancelSubscription(): void {
    if (!this.currentSubscription?.providerSubscriptionId || this.cancelingSubscription || !this.canCancelSubscription) {
      return;
    }

    this.cancelingSubscription = true;
    this.paymentService.cancelSubscription(this.currentSubscription.providerSubscriptionId).subscribe({
      next: () => {
        this.toast.success('Subscription cancellation has been scheduled.', 'Subscription canceled');
        this.cancelingSubscription = false;
        this.loadSubscription();
        this.refreshOrganizationContext();
      },
      error: () => {
        this.toast.error('Unable to cancel subscription right now.', 'Cancellation failed');
        this.cancelingSubscription = false;
      }
    });
  }

  private startSubscriptionCheckout(): void {
    if (this.creatingCheckout) {
      return;
    }

    const orgId = this.organization?.id;
    if (!orgId) {
      this.toast.error('Organization context is missing. Refresh and try again.', 'Subscription unavailable');
      return;
    }

    const stripePriceId = this.resolvePriceId(this.selectedPlan, this.selectedCycle);
    if (!stripePriceId) {
      this.toast.error('Unable to resolve selected plan price.', 'Subscription unavailable');
      return;
    }

    this.creatingCheckout = true;
    this.paymentService.createSubscriptionCheckout({
      mode: 'subscription',
      stripePriceId,
      email: this.organization?.emailAddress,
      orgId,
      successUrl: `${window.location.origin}/admin/subscription-management`,
      cancelUrl: `${window.location.origin}/admin/subscription-management`,
      quantity: 1
    }).subscribe({
      next: (response) => {
        this.creatingCheckout = false;
        if (!response.url) {
          this.toast.error('Checkout session did not return a URL.', 'Subscription unavailable');
          return;
        }

        window.location.assign(response.url);
      },
      error: () => {
        this.creatingCheckout = false;
        this.toast.error('Unable to start subscription checkout right now.', 'Subscription unavailable');
      }
    });
  }

  onRefresh(): void {
    if (this.refreshing) {
      return;
    }

    this.refreshing = true;
    this.loadSubscription(() => {
      this.refreshing = false;
      this.refreshOrganizationContext();
    });
  }

  private loadSubscription(onDone?: () => void): void {
    this.paymentService.getCurrentSubscription().subscribe({
      next: (subscription) => {
        this.currentSubscription = subscription;
        this.bootstrapPlanStateFromSubscription(subscription.providerPriceId);
        onDone?.();
      },
      error: () => {
        this.currentSubscription = null;
        this.currentPlan = null;
        this.currentCycle = null;
        onDone?.();
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

  private bootstrapPlanStateFromSubscription(priceId: string): void {
    const resolved = this.resolvePlanAndCycleFromPriceId(priceId);
    if (!resolved) {
      this.currentPlan = null;
      this.currentCycle = null;
      return;
    }

    this.currentPlan = resolved.plan;
    this.currentCycle = resolved.cycle;
    this.selectedPlan = resolved.plan;
    this.selectedCycle = resolved.cycle;
  }

  private resolvePlanAndCycleFromPriceId(priceId: string): { plan: PlanKey; cycle: BillingCycle } | null {
    const stripe = environment.stripeSettings;
    if (!priceId) return null;

    if (priceId === stripe.goMonthlyPrice) {
      return { plan: 'go', cycle: 'monthly' };
    }

    if (priceId === stripe.goYearlyPrice) {
      return { plan: 'go', cycle: 'yearly' };
    }

    if (priceId === stripe.flowMonthlyPrice) {
      return { plan: 'flow', cycle: 'monthly' };
    }

    if (priceId === stripe.flowYearlyPrice) {
      return { plan: 'flow', cycle: 'yearly' };
    }

    if (priceId === stripe.maxMonthlyPrice) {
      return { plan: 'max', cycle: 'monthly' };
    }

    if (priceId === stripe.maxYearlyPrice) {
      return { plan: 'max', cycle: 'yearly' };
    }

    return null;
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
}
