import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import {
  CommonModule,
  TitleCasePipe,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault
} from '@angular/common';
import { ConnectPaymentComponent } from "./onboarding-steps/connect-payment/connect-payment.component";
import { BrandingComponent } from "../../../admin/branding/branding.component";
import { QuickbooksComponent } from "./onboarding-steps/quickbooks/quickbooks.component";
import { OnboardingService, OnboardingStep } from './services/onboarding.service';

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    NgSwitch,
    NgSwitchCase,
    ConnectPaymentComponent,
    BrandingComponent,
    QuickbooksComponent
  ],
  templateUrl: './onboarding-checklist.component.html'
})
export class OnboardingChecklistComponent implements OnInit, OnDestroy {
  private onboardingService = inject(OnboardingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private organizationContext = inject(OrganizationContextService);

  steps: OnboardingStep[] = [];
  organizationId: string | null = null;
  selectedStep: string | null = null;
  private orgSubscription;

  constructor() {
    this.orgSubscription = this.organizationContext.org$.subscribe(org => {
      this.organizationId = org?.id ?? null;
    });
  }

  ngOnInit() {
    this.loadSteps();
  }

  ngOnDestroy() {
    this.orgSubscription.unsubscribe();
  }

  openStep(stepName: string) {
    this.selectedStep = stepName;
  }

  loadSteps() {
    if (!this.organizationId) return;
    this.onboardingService.getSteps(this.organizationId).subscribe(s => (this.steps = s));
  }

  completeStep(stepName: string) {
    if (!this.organizationId) return;
    this.onboardingService.markStepComplete(this.organizationId, stepName).subscribe(() => {
      this.selectedStep = null;
      this.loadSteps();
    });
  }

  get allComplete() {
    return this.steps.length > 0 && this.steps.every(x => x.isCompleted);
  }

  proceed() {
    if (this.allComplete) this.router.navigate(['/admin']);
  }
}
