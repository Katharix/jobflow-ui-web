import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { InvoiceService } from '../invoices/services/invoice.service';
import { OnboardingChecklistComponent } from '../../views/general/onboarding-checklist/onboarding-checklist.component';
import { JobsService } from '../jobs/services/jobs.service';
import { Job, JobLifecycleStatus } from '../jobs/models/job';
import { CustomersService } from '../customer/services/customer.service';
import { EstimateService } from '../estimates/services/estimate.service';
import { Estimate, EstimateStatus, EstimateStatusLabels } from '../estimates/models/estimate';
import { Invoice, InvoiceStatus } from '../../models/invoice';
import { useNotifierHub } from '../services/useNotifierHub';
import {
   CommandCenterAction,
   CommandCenterFlowStep,
   JobflowCommandCenterComponent
} from './jobflow-command-center/jobflow-command-center.component';

type DashboardClientActivityType =
   | 'estimate-accepted'
   | 'estimate-declined'
   | 'estimate-revision-requested'
   | 'invoice-paid';

interface DashboardClientActivity {
   id: string;
   type: DashboardClientActivityType;
   title: string;
   detail: string;
   occurredAt?: string;
   route: string;
}

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule, OnboardingChecklistComponent, JobflowCommandCenterComponent],
   templateUrl: './dashboard.component.html',
   styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
   private readonly auth = inject(Auth);
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
   clientActivity: DashboardClientActivity[] = [];
   private revisionActivity: DashboardClientActivity[] = [];
   private latestEstimates: Estimate[] = [];
   private latestInvoices: Invoice[] = [];

   private readonly destroy$ = new Subject<void>();
   private clockIntervalId: ReturnType<typeof setInterval> | null = null;
   private readonly notifierHub = useNotifierHub(this.auth, {
      onEstimateRevisionRequested: (payload) => {
         this.addRevisionActivity(payload);
      }
   });

   constructor(
      private readonly orgContext: OrganizationContextService,
      private readonly jobsService: JobsService,
      private readonly invoiceService: InvoiceService,
      private readonly customersService: CustomersService,
      private readonly estimateService: EstimateService
   ) {}

   ngOnInit(): void {
      this.startClock();
      void this.notifierHub.connect();

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

      void this.notifierHub.disconnect();

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
         invoices: this.invoiceService.getByOrganization().pipe(catchError(() => of([] as Invoice[]))),
         estimates: this.estimateService.getByOrganization().pipe(catchError(() => of([] as Estimate[]))),
         customers: this.customersService.getAllByOrganization().pipe(catchError(() => of([] as any[])))
      })
         .pipe(takeUntil(this.destroy$))
         .subscribe(({ jobs, invoices, estimates, customers }) => {
            this.buildDashboardState(jobs, invoices, estimates, customers);
         });
   }

   private buildDashboardState(jobs: Job[], invoices: Invoice[], estimates: Estimate[], customers: any[]): void {
      const openJobs = jobs.filter(job => !this.isJobDone(job));
      const jobsWithoutSchedule = openJobs
         .filter(job => !job.hasAssignments)
         .slice(0, 6);

      const invoiceAttention = invoices
         .filter(invoice => (invoice.balanceDue ?? 0) > 0)
         .slice(0, 6);

      const draftJobs = jobs.filter(job => job.lifecycleStatus === JobLifecycleStatus.Draft);

      this.latestEstimates = estimates;
      this.latestInvoices = invoices;
      this.clientActivity = this.mergeClientActivity();

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
            description: 'Select the right job, then send an invoice without breaking flow.',
            metric: `${this.toCount(invoiceAttention.length)} invoices need follow-up`,
            ctaLabel: 'Select job',
            route: '/admin/invoices',
            queryParams: {
               onboardingAction: 'select-job-for-invoice',
               returnTo: 'dashboard-command-center'
            },
            status: invoiceAttention.length > 0 ? 'attention' : 'clear'
         }
      ];
   }

   getActivityLabel(type: DashboardClientActivityType): string {
      switch (type) {
         case 'estimate-accepted':
            return 'Estimate accepted';
         case 'estimate-declined':
            return 'Estimate declined';
         case 'estimate-revision-requested':
            return 'Estimate revision requested';
         default:
            return 'Invoice paid';
      }
   }

   getActivityClass(type: DashboardClientActivityType): string {
      switch (type) {
         case 'estimate-accepted':
            return 'is-success';
         case 'estimate-declined':
            return 'is-danger';
         case 'estimate-revision-requested':
            return 'is-info';
         default:
            return 'is-primary';
      }
   }

   formatActivityDate(value?: string): string {
      if (!value) return 'Recently';

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Recently';

      return new Intl.DateTimeFormat('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
         hour: 'numeric',
         minute: '2-digit'
      }).format(date);
   }

   private isJobDone(job: Job): boolean {
      return [JobLifecycleStatus.Completed, JobLifecycleStatus.Cancelled, JobLifecycleStatus.Failed].includes(job.lifecycleStatus);
   }

   private toCount(value: number): string {
      return new Intl.NumberFormat('en-US').format(value || 0);
   }

   private buildClientActivity(estimates: Estimate[], invoices: Invoice[]): DashboardClientActivity[] {
      const estimateActivity = estimates
         .map(estimate => {
            const status = this.resolveEstimateStatus(estimate.status);
            if (status !== EstimateStatus.Accepted && status !== EstimateStatus.Declined) {
               return null;
            }

            const clientName = this.estimateClientName(estimate);
            const action = status === EstimateStatus.Accepted ? 'accepted' : 'declined';

            return {
               id: `estimate-${estimate.id}-${action}`,
               type: status === EstimateStatus.Accepted ? 'estimate-accepted' : 'estimate-declined',
               title: `Estimate ${estimate.estimateNumber} ${action}`,
               detail: `${clientName} responded in Client Hub.`,
               occurredAt: estimate.updatedAt ?? estimate.sentAt ?? estimate.estimateDate ?? estimate.createdAt,
               route: '/admin/estimates'
            } as DashboardClientActivity;
         })
         .filter((item): item is DashboardClientActivity => item !== null);

      const invoiceActivity = invoices
         .filter(invoice => this.resolveInvoiceStatus(invoice.status) === InvoiceStatus.Paid)
         .map(invoice => {
            const clientName = this.invoiceClientName(invoice);
            const occurredAt = (invoice as any)?.updatedAt ?? (invoice as any)?.paidAt ?? invoice.invoiceDate ?? invoice.dueDate;

            return {
               id: `invoice-${invoice.id}-paid`,
               type: 'invoice-paid',
               title: `Invoice ${invoice.invoiceNumber} paid`,
               detail: `${clientName} completed payment.`,
               occurredAt,
               route: '/admin/invoices'
            } as DashboardClientActivity;
         });

      return [...estimateActivity, ...invoiceActivity]
         .sort((left, right) => this.dateScore(right.occurredAt) - this.dateScore(left.occurredAt))
         .slice(0, 8);
   }

   private mergeClientActivity(): DashboardClientActivity[] {
      const base = this.buildClientActivity(this.latestEstimates, this.latestInvoices);
      return [...this.revisionActivity, ...base]
         .sort((left, right) => this.dateScore(right.occurredAt) - this.dateScore(left.occurredAt))
         .slice(0, 8);
   }

   private addRevisionActivity(payload: { estimateId: string; revisionRequestId: string; revisionNumber: number; requestedAt: string; message: string }): void {
      if (!payload?.revisionRequestId) {
         return;
      }

      const existing = this.revisionActivity.find(item => item.id === `revision-${payload.revisionRequestId}`);
      if (existing) {
         return;
      }

      const title = `Estimate revision #${payload.revisionNumber} requested`;
      const detail = payload.message?.trim()
         ? payload.message.trim()
         : 'A client requested an estimate revision.';

      const activity: DashboardClientActivity = {
         id: `revision-${payload.revisionRequestId}`,
         type: 'estimate-revision-requested',
         title,
         detail,
         occurredAt: payload.requestedAt,
         route: '/admin/estimates'
      };

      this.revisionActivity = [activity, ...this.revisionActivity].slice(0, 8);

      this.clientActivity = this.mergeClientActivity();
   }

   private resolveEstimateStatus(raw: Estimate['status']): EstimateStatus | null {
      if (typeof raw === 'number') return raw as EstimateStatus;

      const numeric = Number(raw);
      if (!Number.isNaN(numeric)) return numeric as EstimateStatus;

      const normalized = String(raw ?? '').trim().toLowerCase();
      const entry = Object.entries(EstimateStatusLabels).find(([, label]) => label.toLowerCase() === normalized);
      return entry ? (Number(entry[0]) as EstimateStatus) : null;
   }

   private resolveInvoiceStatus(raw: Invoice['status'] | number | string): InvoiceStatus {
      if (typeof raw === 'number') return raw as InvoiceStatus;

      const numeric = Number(raw);
      if (!Number.isNaN(numeric)) return numeric as InvoiceStatus;

      const normalized = String(raw ?? '').trim().toLowerCase();
      switch (normalized) {
         case 'sent':
            return InvoiceStatus.Sent;
         case 'paid':
            return InvoiceStatus.Paid;
         case 'overdue':
            return InvoiceStatus.Overdue;
         case 'unpaid':
            return InvoiceStatus.Unpaid;
         default:
            return InvoiceStatus.Draft;
      }
   }

   private estimateClientName(estimate: Estimate): string {
      const firstName = estimate.organizationClient?.firstName?.trim() ?? '';
      const lastName = estimate.organizationClient?.lastName?.trim() ?? '';
      return `${firstName} ${lastName}`.trim() || 'A client';
   }

   private invoiceClientName(invoice: Invoice): string {
      const firstName = invoice.organizationClient?.firstName?.trim() ?? '';
      const lastName = invoice.organizationClient?.lastName?.trim() ?? '';
      return `${firstName} ${lastName}`.trim() || 'A client';
   }

   private dateScore(value?: string): number {
      if (!value) return 0;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
   }
}
