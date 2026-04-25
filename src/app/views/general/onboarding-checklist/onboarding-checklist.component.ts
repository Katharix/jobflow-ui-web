import { Component, computed, DestroyRef, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OnboardingService, OnboardingStepDto } from './services/onboarding.service';

const VISIBLE_COUNT = 3;

@Component({
   selector: 'app-jobflow-onboarding-checklist',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, TranslateModule],
   templateUrl: './onboarding-checklist.component.html',
   styleUrls: ['./onboarding-checklist.component.scss']
})
export class OnboardingChecklistComponent implements OnChanges {
   private onboardingService = inject(OnboardingService);
   private destroyRef = inject(DestroyRef);
   private router = inject(Router);
   private translate = inject(TranslateService);

   @Input() organizationId: string | null = null;
   @Output() allCompleted = new EventEmitter<void>();

   steps = signal<OnboardingStepDto[]>([]);
   expanded = signal(false);
   private completionSynced = false;
   private prevCompletedKeys = new Set<string>();
   private initialLoadDone = false;

   readonly completedCount = computed(() => this.steps().filter(s => s.isCompleted).length);
   readonly allStepsCompleted = computed(() => {
      const s = this.steps();
      return s.length > 0 && this.completedCount() === s.length;
   });
   readonly nextStep = computed(() => this.steps().find(s => !s.isCompleted) ?? null);
   readonly progress = computed(() => {
      const s = this.steps();
      return s.length > 0 ? Math.round((this.completedCount() / s.length) * 100) : 0;
   });
   readonly visibleSteps = computed(() => {
      const s = this.steps();
      return this.expanded() ? s : s.slice(0, VISIBLE_COUNT);
   });
   readonly hiddenCount = computed(() => Math.max(0, this.steps().length - VISIBLE_COUNT));

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['organizationId'] && this.organizationId) {
         this.load();
      }
   }

   private trackEvent(stepName: string, eventType: 'onboarding_step_started' | 'onboarding_step_completed' | 'onboarding_step_skipped'): void {
      this.onboardingService.trackEvent(stepName, eventType)
         .pipe(catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef))
         .subscribe();
   }

   private load(): void {
      this.onboardingService
         .getChecklist(this.organizationId!)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe(steps => {
            const sorted = steps.sort((a, b) => a.order - b.order);

            if (this.initialLoadDone) {
               for (const step of sorted) {
                  if (step.isCompleted && !this.prevCompletedKeys.has(step.key)) {
                     this.trackEvent(step.key, 'onboarding_step_completed');
                  }
               }
            }

            this.initialLoadDone = true;
            this.prevCompletedKeys = new Set(sorted.filter(s => s.isCompleted).map(s => s.key));
            this.steps.set(sorted);

            if (this.allStepsCompleted()) {
               this.allCompleted.emit();

               if (!this.completionSynced) {
                  this.completionSynced = true;
                  this.onboardingService.completeOnboarding()
                     .pipe(takeUntilDestroyed(this.destroyRef))
                     .subscribe({
                        error: () => { this.completionSynced = false; }
                     });
               }
            }
         });
   }

   getStepState(step: OnboardingStepDto): 'completed' | 'current' | 'upcoming' {
      if (step.isCompleted) return 'completed';
      if (this.nextStep()?.key === step.key) return 'current';
      return 'upcoming';
   }

   isStepLocked(step: OnboardingStepDto): boolean {
      return !step.isCompleted && this.nextStep()?.key !== step.key;
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

   toggleExpanded(): void {
      this.expanded.set(!this.expanded());
   }

   getStepIcon(step: OnboardingStepDto): string {
      const key = (step.key ?? '').toLowerCase();
      const title = (step.title ?? '').toLowerCase();
      const text = `${key} ${title}`;

      if (text.includes('onboarding path') || text.includes('onboarding track')) return 'compass';
      if (text.includes('quick-start') || text.includes('industry')) return 'rocket';
      if (text.includes('payment') || text.includes('stripe') || text.includes('square')) return 'credit-card';
      if (text.includes('branding') || text.includes('brand')) return 'palette';
      if (text.includes('company') || text.includes('organization')) return 'building';
      if (text.includes('employee role') || text.includes('roles')) return 'shield';
      if (text.includes('employee')) return 'users';
      if (text.includes('pricebook') || text.includes('price book')) return 'tag';
      if (text.includes('customer') || text.includes('client')) return 'user-plus';
      if (text.includes('schedule')) return 'calendar';
      if (text.includes('job')) return 'briefcase';
      if (text.includes('invoice')) return 'file-text';
      return 'circle';
   }

   getStepRoute(step: OnboardingStepDto): string | null {
      const key = (step.key ?? '').toLowerCase();
      const title = (step.title ?? '').toLowerCase();
      const text = `${key} ${title}`;

      if (text.includes('schedule')) return '/admin/scheduling-jobs';

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

      if (text.includes('schedule')) return null;

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

   private readonly STEP_TIME_ESTIMATES: Record<string, string> = {
      choose_track: '1 min',
      choose_industry_preset: '2 min',
      create_customer: '2 min',
      create_job: '3 min',
      schedule_job: '2 min',
      create_invoice: '3 min',
      connect_stripe: '5 min',
      send_invoice: '1 min',
      receive_payment: '1 min'
   };

   private readonly OPTIONAL_STEPS = new Set(['choose_industry_preset']);

   getStepTimeEstimate(step: OnboardingStepDto): string | null {
      return this.STEP_TIME_ESTIMATES[step.key] ?? null;
   }

   isStepOptional(step: OnboardingStepDto): boolean {
      return this.OPTIONAL_STEPS.has(step.key);
   }

   onStepClick(step: OnboardingStepDto): void {
      if (!this.canOpenStep(step)) return;
      const route = this.getStepRoute(step);
      if (!route) return;
      this.trackEvent(step.key, 'onboarding_step_started');
      const onboardingAction = this.getStepOnboardingAction(step);
      this.router.navigate([route], {
         queryParams: onboardingAction ? { onboardingAction } : undefined
      });
   }
}
