import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {OnboardingService, OnboardingStepDto} from "./services/onboarding.service";
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {OrganizationDto} from "../../../models/organization";


@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-checklist.component.html',
})
export class OnboardingChecklistComponent implements OnInit, OnDestroy {
  @Input({ required: true }) organizationId: string | null = null;

  steps: OnboardingStepDto[] = [];
  nextStep: OnboardingStepDto | null = null;
  organization!: OrganizationDto;

  private organizationContext = inject(OrganizationContextService);
  private destroy$ = new Subject<void>();

  constructor(
    private onboardingService: OnboardingService,
    private router: Router
  ) {
    this.organizationContext.org$.subscribe(org => {
      if (org) {
        this.organization = org;
        this.organizationId = org.id ?? null;
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.onboardingService
      .getChecklist(this.organizationId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe((steps) => {
        this.steps = (steps ?? []).slice().sort((a, b) => a.order - b.order);
        this.nextStep = this.steps.find(s => !s.isCompleted) ?? null;
      });
  }

  goTo(step: OnboardingStepDto): void {
    // Truth-driven routing: backend decides state, UI routes.
    switch (step.key) {
      case 'create_customer':
        this.router.navigate(['/customers/new']);
        break;

      case 'create_job':
        this.router.navigate(['/jobs/new']);
        break;

      case 'schedule_job':
        this.router.navigate(['/schedule']);
        break;

      case 'create_invoice':
        this.router.navigate(['/invoices/new']);
        break;

      case 'send_invoice':
        this.router.navigate(['/invoices']);
        break;

      case 'receive_payment':
        // v1: route to billing/connect stripe page if needed, otherwise invoices.
        // If you don’t have /billing yet, route to /invoices and show a “Connect Stripe” CTA there.
        this.router.navigate(['/billing']);
        break;

      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  goNext(): void {
    if (!this.nextStep) return;
    this.goTo(this.nextStep);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
