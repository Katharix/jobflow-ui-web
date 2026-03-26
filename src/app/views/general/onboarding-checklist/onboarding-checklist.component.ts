import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TimelineModule } from 'primeng/timeline';
import { TranslateModule } from '@ngx-translate/core';
import { OnboardingService, OnboardingStepDto } from './services/onboarding.service';

@Component({
   selector: 'app-jobflow-onboarding-checklist',
   standalone: true,
   imports: [CommonModule, TimelineModule, TranslateModule],
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

   getStepActionTitleKey(step: OnboardingStepDto): string {
      if (step.isCompleted) return 'onboarding.stepCompletedTitle';
      if (this.isStepLocked(step)) return 'onboarding.stepLockedTitle';
      return this.getStepRoute(step)
         ? 'onboarding.stepOpenTitle'
         : 'onboarding.stepNoRouteTitle';
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

   getStepDescriptionKey(step: OnboardingStepDto): string {
      const key = (step.key ?? '').toLowerCase();
      const title = (step.title ?? '').toLowerCase();
      const text = `${key} ${title}`;

      if (text.includes('onboarding path')) return 'onboarding.description.track';
      if (text.includes('quick-start') || text.includes('industry')) return 'onboarding.description.quickStart';

      if (text.includes('payment') || text.includes('stripe') || text.includes('square')) return 'onboarding.description.payment';
      if (text.includes('branding') || text.includes('brand')) return 'onboarding.description.branding';
      if (text.includes('company') || text.includes('organization')) return 'onboarding.description.company';
      if (text.includes('employee role') || text.includes('roles')) return 'onboarding.description.roles';
      if (text.includes('employee')) return 'onboarding.description.employees';
      if (text.includes('pricebook') || text.includes('price book')) return 'onboarding.description.pricebook';
      if (text.includes('customer') || text.includes('client')) return 'onboarding.description.customer';
      if (text.includes('job')) return 'onboarding.description.job';
      if (text.includes('invoice')) return 'onboarding.description.invoice';

      return 'onboarding.description.default';
   }

   getStepActionLabelKey(step: OnboardingStepDto): string {
      return step.isCompleted
         ? 'onboarding.action.completed'
         : 'onboarding.action.complete';
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
