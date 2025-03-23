import { Component } from '@angular/core';
import { plans } from '../data';
import { PricingPlan } from '../types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent {
  plans = plans
  // Type for the billing toggle (whether it's annual or not)
  isAnnual: boolean = false;

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
  
}
