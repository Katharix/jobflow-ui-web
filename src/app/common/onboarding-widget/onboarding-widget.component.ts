import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OnboardingService, OnboardingStepDto } from '../../views/general/onboarding-checklist/services/onboarding.service';
import { WalkthroughService } from '../../services/shared/walkthrough.service';

const STEP_ROUTES: Record<string, string> = {
  choose_track: '/admin/onboarding/quick-start',
  choose_industry_preset: '/admin/onboarding/quick-start',
  setup_company: '/admin/company',
  create_customer: '/admin/clients/create',
  create_job: '/admin/jobs',
  schedule_job: '/admin/scheduling-jobs',
  create_invoice: '/admin/invoices',
  connect_stripe: '/admin/connectedpayment',
  send_invoice: '/admin/invoices',
  receive_payment: '/admin/invoices',
};

@Component({
  selector: 'app-onboarding-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './onboarding-widget.component.html',
  styleUrl: './onboarding-widget.component.scss',
})
export class OnboardingWidgetComponent implements OnInit {
  private orgContext = inject(OrganizationContextService);
  private onboardingService = inject(OnboardingService);
  private walkthrough = inject(WalkthroughService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  visible = signal(false);
  collapsed = signal(true);
  steps = signal<OnboardingStepDto[]>([]);
  private orgId: string | null = null;

  readonly completedCount = computed(() => this.steps().filter(s => s.isCompleted).length);
  readonly totalCount = computed(() => this.steps().length);
  readonly progress = computed(() => {
    const t = this.totalCount();
    return t > 0 ? Math.round((this.completedCount() / t) * 100) : 0;
  });
  readonly nextStep = computed(() => this.steps().find(s => !s.isCompleted) ?? null);
  readonly hasTour = computed(() => {
    const step = this.nextStep();
    return step ? this.walkthrough.hasWalkthrough(step.key) : false;
  });

  ngOnInit(): void {
    this.orgContext.org$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(org => {
        const complete = org?.onboardingComplete ?? false;
        this.orgId = org?.id ?? null;
        this.visible.set(!!this.orgId && !complete);
        if (this.visible() && this.orgId) {
          this.loadSteps();
        }
      });
  }

  private loadSteps(): void {
    this.onboardingService
      .getChecklist(this.orgId!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(steps => this.steps.set(steps.sort((a, b) => a.order - b.order)));
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
  }

  startTour(): void {
    const step = this.nextStep();
    if (step) this.walkthrough.startWalkthrough(step.key);
  }

  navigateToStep(): void {
    const step = this.nextStep();
    if (!step) return;
    const route = STEP_ROUTES[step.key];
    if (route) this.router.navigate([route]);
  }
}
