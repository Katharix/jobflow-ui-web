import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TimelineModule } from 'primeng/timeline';
import { OnboardingService, OnboardingStepDto } from './services/onboarding.service';

@Component({
    selector: 'app-jobflow-onboarding-checklist',
    imports: [CommonModule, TimelineModule],
    templateUrl: './onboarding-checklist.component.html',
    styleUrls: ['./onboarding-checklist.component.scss']
})
export class OnboardingChecklistComponent implements OnChanges {
   private onboardingService = inject(OnboardingService);
   private router = inject(Router);

   @Input() organizationId: string | null = null;
   @Output() allCompleted = new EventEmitter<void>();


   steps: OnboardingStepDto[] = [];
   nextStep: OnboardingStepDto | null = null;
   private completionSynced = false;

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['organizationId'] && this.organizationId) {
         this.load();
      }
   }

   private load(): void {
      this.onboardingService
         .getChecklist(this.organizationId!)
         .subscribe(steps => {
            this.steps = steps.sort((a, b) => a.order - b.order);
            this.nextStep = this.steps.find(s => !s.isCompleted) ?? null;
            if (this.allStepsCompleted) {
               this.allCompleted.emit();

               if (!this.completionSynced) {
                  this.completionSynced = true;
                  this.onboardingService.completeOnboarding().subscribe({
                     error: () => {
                        this.completionSynced = false;
                     }
                  });
               }
            }
         });
   }

   get completedCount(): number {
      return this.steps.filter(step => step.isCompleted).length;
   }

   get allStepsCompleted(): boolean {
      return this.steps.length > 0 && this.completedCount === this.steps.length;
   }

   getStepState(step: OnboardingStepDto): 'completed' | 'current' | 'upcoming' {
      if (step.isCompleted) return 'completed';
      if (this.nextStep?.key === step.key) return 'current';
      return 'upcoming';
   }

   isStepLocked(step: OnboardingStepDto): boolean {
      return !step.isCompleted && this.nextStep?.key !== step.key;
   }

   canOpenStep(step: OnboardingStepDto): boolean {
      return !step.isCompleted && !this.isStepLocked(step) && !!this.getStepRoute(step);
   }

   getStepActionTitle(step: OnboardingStepDto): string {
      if (step.isCompleted) return 'Step already completed';
      if (this.isStepLocked(step)) return 'Complete the previous step first';
      return this.getStepRoute(step) ? 'Open step' : 'No route configured for this step yet';
   }

   getMarkerIcon(step: OnboardingStepDto): string {
      const state = this.getStepState(step);
      if (state === 'completed') return 'pi pi-check';
      if (state === 'current') return 'pi pi-arrow-right';
      return 'pi pi-circle-fill';
   }

   getStepRoute(step: OnboardingStepDto): string | null {
      const key = (step.key ?? '').toLowerCase();
      const title = (step.title ?? '').toLowerCase();
      const text = `${key} ${title}`;

      if (text.includes('quick-start') || text.includes('onboarding path') || text.includes('industry')) {
         return '/admin/onboarding/quick-start';
      }

      if (text.includes('payment') || text.includes('stripe') || text.includes('square')) return '/admin/connectedpayment';
      if (text.includes('branding') || text.includes('brand')) return '/admin/settings/branding';
      if (text.includes('company') || text.includes('organization')) return '/admin/company';
      if (text.includes('employee role') || text.includes('roles')) return '/admin/employees/roles';
      if (text.includes('employee')) return '/admin/employees';
      if (text.includes('pricebook') || text.includes('price book')) return '/admin/pricebook';
      if (text.includes('customer') || text.includes('client')) return '/admin/clients/create';
      if (text.includes('job')) return '/admin/jobs';
      if (text.includes('invoice')) return '/admin/invoices';

      return null;
   }

   getStepOnboardingAction(step: OnboardingStepDto): string | null {
      const key = (step.key ?? '').toLowerCase();
      const title = (step.title ?? '').toLowerCase();
      const text = `${key} ${title}`;

      if (text.includes('employee role') || text.includes('roles')) return 'open-role-modal';
      if (text.includes('employee')) return 'open-employee-modal';
      if (text.includes('pricebook') || text.includes('price book')) return 'open-pricebook-modal';
      if (text.includes('customer') || text.includes('client')) return 'open-client-drawer';
      if (text.includes('job')) return 'open-job-drawer';

      return null;
   }

   getStepDescription(step: OnboardingStepDto): string {
      const key = (step.key ?? '').toLowerCase();
      const title = (step.title ?? '').toLowerCase();
      const text = `${key} ${title}`;

      if (text.includes('onboarding path')) return 'Pick the onboarding track that matches your immediate priorities.';
      if (text.includes('quick-start') || text.includes('industry')) return 'Select an industry preset to load suggested services and workflow labels.';

      if (text.includes('payment') || text.includes('stripe') || text.includes('square')) return 'Connect your payment provider so you can collect payments.';
      if (text.includes('branding') || text.includes('brand')) return 'Upload your logo and set your brand details.';
      if (text.includes('company') || text.includes('organization')) return 'Add your company profile and business information.';
      if (text.includes('employee role') || text.includes('roles')) return 'Set up roles to control permissions for your team.';
      if (text.includes('employee')) return 'Add team members who will schedule and complete work.';
      if (text.includes('pricebook') || text.includes('price book')) return 'Create services and pricing used when building jobs.';
      if (text.includes('customer') || text.includes('client')) return 'Create your first customer contact to start booking jobs.';
      if (text.includes('job')) return 'Create and schedule your first job to begin operations.';
      if (text.includes('invoice')) return 'Generate your first invoice and prepare to get paid.';

      return 'Complete this setup step to continue onboarding.';
   }

   onStepClick(step: OnboardingStepDto): void {
      if (!this.canOpenStep(step)) return;
      const route = this.getStepRoute(step);
      if (!route) return;
      const onboardingAction = this.getStepOnboardingAction(step);
      this.router.navigate([route], {
         queryParams: onboardingAction ? { onboardingAction } : undefined
      });
   }
}
