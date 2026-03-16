import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { InvoiceService } from '../invoices/services/invoice.service';
import { OnboardingChecklistComponent } from '../../views/general/onboarding-checklist/onboarding-checklist.component';
import { JobsService } from '../jobs/services/jobs.service';
import { Job, JobLifecycleStatus } from '../jobs/models/job';
import { CustomersService } from '../customer/services/customer.service';
import {
   CommandCenterAction,
   CommandCenterFlowStep,
   JobflowCommandCenterComponent
} from './jobflow-command-center/jobflow-command-center.component';

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, OnboardingChecklistComponent, JobflowCommandCenterComponent],
   templateUrl: './dashboard.component.html',
   styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
   organizationId: string | null = null;
   organizationName = 'your organization';
   currentDateTime = '';

   primaryActions: CommandCenterAction[] = [
      {
         label: 'Create a job',
         description: 'Launch the job intake drawer instantly',
         route: '/admin/jobs',
         icon: 'pi pi-briefcase',
         queryParams: {
            onboardingAction: 'open-job-drawer',
            returnTo: 'dashboard-command-center'
         }
      },
      {
         label: 'Add customer',
         description: 'Capture client details before job intake',
         route: '/admin/clients/create',
         icon: 'pi pi-user-plus',
         queryParams: {
            onboardingAction: 'open-client-drawer',
            returnTo: 'dashboard-command-center'
         }
      }
   ];

   flowSteps: CommandCenterFlowStep[] = [];

   private readonly destroy$ = new Subject<void>();
   private clockIntervalId: ReturnType<typeof setInterval> | null = null;

   constructor(
      private readonly orgContext: OrganizationContextService,
      private readonly jobsService: JobsService,
      private readonly invoiceService: InvoiceService,
      private readonly customersService: CustomersService
   ) {}

   ngOnInit(): void {
      this.startClock();

      this.orgContext.org$
         .pipe(takeUntil(this.destroy$))
         .subscribe(org => {
            this.organizationId = org?.id ?? null;
            this.organizationName = org?.organizationName?.trim() || 'your organization';

            if (!this.organizationId) {
               this.flowSteps = [];
               return;
            }

            this.loadDashboard();
         });
   }

   ngOnDestroy(): void {
      if (this.clockIntervalId) {
         clearInterval(this.clockIntervalId);
      }

      this.destroy$.next();
      this.destroy$.complete();
   }

   get welcomeTitle(): string {
      return `Welcome, ${this.organizationName}`;
   }

   get welcomeSubtext(): string {
      return 'Here’s your command center for today—start with what matters most.';
   }

   private startClock(): void {
      this.updateCurrentDateTime();
      this.clockIntervalId = setInterval(() => this.updateCurrentDateTime(), 1000 * 30);
   }

   private updateCurrentDateTime(): void {
      this.currentDateTime = new Intl.DateTimeFormat('en-US', {
         weekday: 'long',
         month: 'long',
         day: 'numeric',
         year: 'numeric',
         hour: 'numeric',
         minute: '2-digit'
      }).format(new Date());
   }

   private loadDashboard(): void {
      forkJoin({
         jobs: this.jobsService.getAllJobs().pipe(catchError(() => of([] as Job[]))),
         invoices: this.invoiceService.getByOrganization().pipe(catchError(() => of([] as any[]))),
         customers: this.customersService.getAllByOrganization().pipe(catchError(() => of([] as any[])))
      })
         .pipe(takeUntil(this.destroy$))
         .subscribe(({ jobs, invoices, customers }) => {
            this.buildDashboardState(jobs, invoices, customers);
         });
   }

   private buildDashboardState(jobs: Job[], invoices: any[], customers: any[]): void {
      const openJobs = jobs.filter(job => !this.isJobDone(job));
      const jobsWithoutSchedule = openJobs
         .filter(job => !job.hasAssignments)
         .slice(0, 6);

      const invoiceAttention = invoices
         .filter(invoice => (invoice.balanceDue ?? 0) > 0)
         .slice(0, 6);

      const draftJobs = jobs.filter(job => job.lifecycleStatus === JobLifecycleStatus.Draft);

      this.flowSteps = [
         {
            step: 'Step 1',
            title: 'Capture customer details',
            description: 'Begin with a complete client profile so every job starts with clean context.',
            metric: `${this.toCount(customers.length)} total customers`,
            ctaLabel: 'Add customer',
            route: '/admin/clients/create',
            queryParams: {
               onboardingAction: 'open-client-drawer',
               returnTo: 'dashboard-command-center'
            },
            status: customers.length === 0 ? 'attention' : 'ready'
         },
         {
            step: 'Step 2',
            title: 'Create job brief',
            description: 'Define job title and client quickly, then move directly into execution.',
            metric: `${this.toCount(draftJobs.length)} draft jobs`,
            ctaLabel: 'Start new job',
            route: '/admin/jobs',
            queryParams: {
               onboardingAction: 'open-job-drawer',
               returnTo: 'dashboard-command-center'
            },
            status: draftJobs.length > 0 ? 'ready' : 'attention'
         },
         {
            step: 'Step 3',
            title: 'Lock the schedule',
            description: 'Convert unscheduled jobs into committed calendar slots.',
            metric: `${this.toCount(jobsWithoutSchedule.length)} waiting to schedule`,
            ctaLabel: 'Open jobs board',
            route: '/admin/jobs',
            queryParams: { returnTo: 'dashboard-command-center' },
            status: jobsWithoutSchedule.length > 0 ? 'attention' : 'clear'
         },
         {
            step: 'Step 4',
            title: 'Invoice and collect',
            description: 'Close the loop with timely invoicing and proactive collections.',
            metric: `${this.toCount(invoiceAttention.length)} invoices need follow-up`,
            ctaLabel: 'Review invoices',
            route: '/admin/invoices',
            queryParams: { returnTo: 'dashboard-command-center' },
            status: invoiceAttention.length > 0 ? 'attention' : 'clear'
         }
      ];
   }

   private isJobDone(job: Job): boolean {
      return [JobLifecycleStatus.Completed, JobLifecycleStatus.Cancelled, JobLifecycleStatus.Failed].includes(job.lifecycleStatus);
   }

   private toCount(value: number): string {
      return new Intl.NumberFormat('en-US').format(value || 0);
   }
}
