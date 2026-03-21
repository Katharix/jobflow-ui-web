import { Component, inject } from '@angular/core';
import {plans} from '../data';
import {PricingPlan} from '../types';
import {CommonModule} from '@angular/common';
import {environment} from '../../../../../environments/environment';
import {Router} from '@angular/router';

@Component({
   selector: 'app-pricing',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './pricing.component.html',
   styleUrl: './pricing.component.scss'
})
export class PricingComponent {
   private router = inject(Router);

   plans = plans
   // Type for the billing toggle (whether it's annual or not)
   isAnnual = false;

   // Toggle between monthly and annual billing
   toggleBilling(): void {
      this.isAnnual = !this.isAnnual;
   }

   // Get formatted price depending on billing type (monthly or annual)
   getPrice(plan: PricingPlan): string {
      if (this.isAnnual) {
         return `$${plan.annualPrice.toFixed(0)} / Year`;
      } else {
         return `$${plan.price.toFixed(0)} / Month`;
      }
   }

   subscribeToPlan(plan: string) {
      const subscriptionPlanId = this.getSubscriptionPlanId(plan);
      this.router.navigate(['/subscribe'], {queryParams: {planId: subscriptionPlanId}});
   }

   getSubscriptionPlanId(plan: string): string {
      if (plan === 'Go') {
         return this.isAnnual ? environment.stripeSettings.goYearlyPrice : environment.stripeSettings.goMonthlyPrice;
      }
      if (plan === 'Flow') {
         return this.isAnnual ? environment.stripeSettings.flowYearlyPrice : environment.stripeSettings.flowMonthlyPrice;
      }
      return this.isAnnual ? environment.stripeSettings.maxYearlyPrice : environment.stripeSettings.maxMonthlyPrice;
   }
}
