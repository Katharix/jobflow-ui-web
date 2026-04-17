import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { TranslateModule } from '@ngx-translate/core';

import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationService } from '../../services/shared/organization.service';
import { OnboardingService } from '../../views/general/onboarding-checklist/services/onboarding.service';
import { InvoiceService } from '../invoices/services/invoice.service';
import { OnboardingChecklistComponent } from '../../views/general/onboarding-checklist/onboarding-checklist.component';
import { UserProfileService } from '../../services/shared/user-profile.service';
import { JobsService } from '../jobs/services/jobs.service';
import { Job, JobLifecycleStatus } from '../jobs/models/job';
import { CustomersService } from '../customer/services/customer.service';
import { Client } from '../customer/models/customer';
import { EstimateService } from '../estimates/services/estimate.service';
import { Estimate, EstimateStatus, EstimateStatusLabels } from '../estimates/models/estimate';
import { Invoice, InvoiceStatus } from '../../models/invoice';
import { useNotifierHub } from '../services/useNotifierHub';
import { ToastService } from '../../common/toast/toast.service';

type DashboardClientActivityType =
   | 'estimate-accepted'
   | 'estimate-declined'
   | 'estimate-revision-requested'
   | 'invoice-paid'
   | 'client-chat-message'
   | 'client-job-update';

interface DashboardKpi {
   id: string;
   label: string;
   value: string;
   detail?: string;
   tone?: 'success' | 'warning' | 'danger' | 'info';
   route?: string;
}

interface DashboardClientActivity {
   id: string;
   type: DashboardClientActivityType;
   title: string;
   detail: string;
   occurredAt?: string;
   route: string;
}

interface DashboardKpiMetrics {
   revenue30: number;
   outstandingBalance: number;
   overdueBalance: number;
   overdueCount: number;
   paidInvoices: number;
   sentInvoices: number;
   openJobs: number;
   draftJobs: number;
   jobsWithoutSchedule: number;
   jobsInProgress: number;
   assignmentsToday: number;
   assignmentsInProgress: number;
   assignmentsCompleted: number;
   acceptedEstimateValue: number;
   revisionRequests: number;
   totalCustomers: number;
}

type InvoiceWithDates = Invoice & {
   updatedAt?: string;
   paidAt?: string;
};

type DashboardTab = 'setup-guide' | 'dashboard';

interface WorkflowCard {
   id: string;
   label: string;
   count: number;
   detail: string;
   tone: 'orange' | 'red' | 'green' | 'blue';
   route: string;
}

interface AppointmentStats {
   total: number;
   active: number;
   completed: number;
   overdue: number;
   remaining: number;
}

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule, TranslateModule, OnboardingChecklistComponent],
   templateUrl: './dashboard.component.html',
   styleUrl: './dashboard.component.scss',
   changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
   private readonly orgContext = inject(OrganizationContextService);
   private readonly organizationService = inject(OrganizationService);
   private readonly onboardingService = inject(OnboardingService);
   private readonly userProfileService = inject(UserProfileService);
   private readonly jobsService = inject(JobsService);
   private readonly invoiceService = inject(InvoiceService);
   private readonly customersService = inject(CustomersService);
   private readonly estimateService = inject(EstimateService);
   private readonly cdr = inject(ChangeDetectorRef);
   private readonly toast = inject(ToastService);

   private readonly auth = inject(Auth);
   organizationId: string | null = null;
   organizationName = 'your organization';
   currentDateTime = '';
   showOnboardingChecklist = false;
   private checklistCompleted = false;

   activeTab: DashboardTab = 'dashboard';
   userFirstName = '';
   greetingText = '';
   loadingWorkflow = true;
   loadingAppointments = true;
   loadingPerformance = true;

   workflowCards: WorkflowCard[] = [];
   appointmentStats: AppointmentStats = { total: 0, active: 0, completed: 0, overdue: 0, remaining: 0 };

   miniTiles: DashboardKpi[] = [];


   clientActivity: DashboardClientActivity[] = [];
   private revisionActivity: DashboardClientActivity[] = [];
   private realtimeActivity: DashboardClientActivity[] = [];
   private latestEstimates: Estimate[] = [];
   private latestInvoices: Invoice[] = [];

   kpiMetrics: DashboardKpiMetrics = this.buildEmptyKpiMetrics();

   private readonly destroy$ = new Subject<void>();
   private clockIntervalId: ReturnType<typeof setInterval> | null = null;
   private onboardingSyncOrgId: string | null = null;
   private readonly notifierHub = useNotifierHub(this.auth, {
      onEstimateRevisionRequested: (payload) => {
         this.addRevisionActivity(payload);
         this.toast.info(`Revision #${payload.revisionNumber} requested`, 'Estimate Revision');
         this.cdr.markForCheck();
      },
      onInvoicePaid: (payload) => {
         this.toast.success(`Invoice payment of $${payload.amountPaid?.toFixed(2) ?? '0.00'} received`, 'Payment Received');
         this.refreshDashboardAfterPayment();
      },
      onJobStatusChanged: (payload) => {
         this.toast.info(`Job "${payload.jobTitle}" status changed`, 'Job Updated');
         this.loadDashboard();
      },
      onEstimateStatusChanged: (payload) => {
         const statusLabel = payload.status === 'Accepted' || payload.status === '3' ? 'accepted' : 'declined';
         const toastFn = statusLabel === 'accepted' ? this.toast.success.bind(this.toast) : this.toast.warning.bind(this.toast);
         toastFn(`Estimate ${statusLabel}`, 'Estimate Update');
         this.loadDashboard();
      },
      onClientChatMessage: (payload) => {
         this.addChatMessageActivity(payload);
         this.toast.info(`${payload.clientName}: ${payload.messagePreview}`, 'New Message');
         this.cdr.markForCheck();
      },
      onClientJobUpdate: (payload) => {
         this.addJobUpdateActivity(payload);
         this.toast.info(`${payload.clientName} posted an update on "${payload.jobTitle}"`, 'Job Update');
         this.cdr.markForCheck();
      }
   });

   ngOnInit(): void {
      this.startClock();
      this.updateGreeting();
      this.loadUserProfile();
      void this.notifierHub.connect();

      this.orgContext.org$
         .pipe(takeUntil(this.destroy$))
         .subscribe(org => {
            this.organizationId = org?.id ?? null;
            this.organizationName = org?.organizationName?.trim() || 'your organization';
            this.showOnboardingChecklist = !(org?.onboardingComplete ?? false) && !this.checklistCompleted;

            if (this.showOnboardingChecklist) {
               this.activeTab = 'setup-guide';
            } else {
               this.activeTab = 'dashboard';
            }

            if (this.organizationId && this.showOnboardingChecklist) {
               this.syncOnboardingCompletion(this.organizationId);
            }

            if (!this.organizationId) {
               this.loadingWorkflow = false;
               this.loadingAppointments = false;
               this.loadingPerformance = false;
               this.cdr.markForCheck();
               return;
            }

            this.loadDashboard();
            this.cdr.markForCheck();
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

   setActiveTab(tab: DashboardTab): void {
      this.activeTab = tab;
   }

   private loadUserProfile(): void {
      this.userProfileService.getMe()
         .pipe(
            catchError(() => of(null)),
            takeUntil(this.destroy$)
         )
         .subscribe(profile => {
            this.userFirstName = profile?.firstName?.trim() || '';
            this.updateGreeting();
            this.cdr.markForCheck();
         });
   }

   private updateGreeting(): void {
      const hour = new Date().getHours();
      let timeOfDay: string;
      if (hour < 12) {
         timeOfDay = 'morning';
      } else if (hour < 17) {
         timeOfDay = 'afternoon';
      } else {
         timeOfDay = 'evening';
      }
      const name = this.userFirstName || this.organizationName;
      this.greetingText = `Good ${timeOfDay}, ${name}`;
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
      this.loadingWorkflow = true;
      this.loadingAppointments = true;
      this.loadingPerformance = true;

      forkJoin({
         jobs: this.jobsService.getAllJobs().pipe(catchError(() => of([] as Job[]))),
         invoices: this.invoiceService.getByOrganization().pipe(catchError(() => of([] as Invoice[]))),
         estimates: this.estimateService.getByOrganization().pipe(catchError(() => of([] as Estimate[]))),
         customers: this.customersService.getAllByOrganization().pipe(catchError(() => of([] as Client[])))
      })
         .pipe(takeUntil(this.destroy$))
         .subscribe(({ jobs, invoices, estimates, customers }) => {
            this.buildDashboardState(jobs, invoices, estimates, customers);
            this.loadingWorkflow = false;
            this.loadingAppointments = false;
            this.loadingPerformance = false;
            this.cdr.markForCheck();
         });
   }

   private buildDashboardState(jobs: Job[], invoices: Invoice[], estimates: Estimate[], customers: Client[]): void {
      this.latestEstimates = estimates;
      this.latestInvoices = invoices;
      this.clientActivity = this.mergeClientActivity();

      this.kpiMetrics = this.computeKpiMetrics(jobs, invoices, estimates, customers);
      this.miniTiles = this.buildMiniTiles();
      this.workflowCards = this.buildWorkflowCards(estimates, jobs, invoices);
      this.appointmentStats = this.buildAppointmentStats(jobs);
   }

   getActivityLabel(type: DashboardClientActivityType): string {
      switch (type) {
         case 'estimate-accepted':
            return 'Estimate accepted';
         case 'estimate-declined':
            return 'Estimate declined';
         case 'estimate-revision-requested':
            return 'Estimate revision requested';
         case 'client-chat-message':
            return 'Message received';
         case 'client-job-update':
            return 'Job update';
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
         case 'client-chat-message':
            return 'is-info';
         case 'client-job-update':
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

   private formatCurrency(value: number): string {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD',
         maximumFractionDigits: 0
      }).format(value || 0);
   }

   private computeKpiMetrics(jobs: Job[], invoices: Invoice[], estimates: Estimate[], customers: Client[]): DashboardKpiMetrics {
      const openJobs = jobs.filter(job => !this.isJobDone(job));
      const draftJobs = jobs.filter(job => job.lifecycleStatus === JobLifecycleStatus.Draft);
      const jobsInProgress = jobs.filter(job => job.lifecycleStatus === JobLifecycleStatus.InProgress);

      const assignments = jobs.flatMap(job => job.assignments ?? []);
      const today = new Date();
      const assignmentsToday = assignments.filter(assignment => this.isSameDay(assignment.scheduledStart, today));
      const assignmentsInProgress = assignments.filter(assignment => this.assignmentStatusIs(assignment.status, 'inprogress'));
      const assignmentsCompleted = assignments.filter(assignment => this.assignmentStatusIs(assignment.status, 'completed'));

      const resolvedInvoices = invoices.map(invoice => ({
         invoice,
         status: this.resolveInvoiceStatus(invoice.status)
      }));

      const paidInvoices = resolvedInvoices.filter(item => item.status === InvoiceStatus.Paid);
      const sentInvoices = resolvedInvoices.filter(item => item.status === InvoiceStatus.Sent);
      const overdueInvoices = resolvedInvoices.filter(item => item.status === InvoiceStatus.Overdue);

      const revenue30 = paidInvoices
         .filter(item => this.isWithinDays(this.resolveInvoicePaidAt(item.invoice) ?? item.invoice.invoiceDate, 30))
         .reduce((sum, item) => sum + this.resolvePaidAmount(item.invoice), 0);

      const outstandingBalance = resolvedInvoices
         .filter(item => item.status !== InvoiceStatus.Paid && item.status !== InvoiceStatus.Refunded)
         .reduce((sum, item) => sum + (item.invoice.balanceDue ?? 0), 0);

      const overdueBalance = overdueInvoices
         .reduce((sum, item) => sum + (item.invoice.balanceDue ?? 0), 0);

      const acceptedEstimates = estimates.filter(estimate => this.resolveEstimateStatus(estimate.status) === EstimateStatus.Accepted);
      const acceptedEstimateValue = acceptedEstimates.reduce((sum, estimate) => sum + (estimate.total ?? 0), 0);
      const revisionRequests = estimates.filter(estimate => this.resolveEstimateStatus(estimate.status) === EstimateStatus.RevisionRequested).length;

      return {
         revenue30,
         outstandingBalance,
         overdueBalance,
         overdueCount: overdueInvoices.length,
         paidInvoices: paidInvoices.length,
         sentInvoices: sentInvoices.length,
         openJobs: openJobs.length,
         draftJobs: draftJobs.length,
         jobsWithoutSchedule: openJobs.filter(job => !job.hasAssignments).length,
         jobsInProgress: jobsInProgress.length,
         assignmentsToday: assignmentsToday.length,
         assignmentsInProgress: assignmentsInProgress.length,
         assignmentsCompleted: assignmentsCompleted.length,
         acceptedEstimateValue,
         revisionRequests,
         totalCustomers: customers.length
      };
   }

   private buildMiniTiles(): DashboardKpi[] {
      const metrics = this.kpiMetrics;
      return [
         {
            id: 'mini-revenue',
            label: 'Revenue (30d)',
            value: this.formatCurrency(metrics.revenue30),
            detail: `${this.toCount(metrics.paidInvoices)} paid invoices`,
            tone: metrics.revenue30 > 0 ? 'success' : 'warning',
            route: '/admin/invoices'
         },
         {
            id: 'mini-outstanding',
            label: 'Outstanding',
            value: this.formatCurrency(metrics.outstandingBalance),
            detail: `${this.toCount(metrics.sentInvoices)} sent`,
            tone: metrics.outstandingBalance > 0 ? 'warning' : 'success',
            route: '/admin/billing-payments'
         },
         {
            id: 'mini-overdue',
            label: 'Overdue',
            value: this.toCount(metrics.overdueCount),
            detail: this.formatCurrency(metrics.overdueBalance),
            tone: metrics.overdueCount > 0 ? 'danger' : 'success',
            route: '/admin/billing-payments'
         },
         {
            id: 'mini-schedule',
            label: 'Needs scheduling',
            value: this.toCount(metrics.jobsWithoutSchedule),
            detail: `${this.toCount(metrics.openJobs)} open jobs`,
            tone: metrics.jobsWithoutSchedule > 0 ? 'warning' : 'success',
            route: '/admin/jobs'
         }
      ];
   }

   private buildWorkflowCards(estimates: Estimate[], jobs: Job[], invoices: Invoice[]): WorkflowCard[] {
      const pendingEstimates = estimates.filter(e => {
         const status = this.resolveEstimateStatus(e.status);
         return status !== EstimateStatus.Accepted && status !== EstimateStatus.Declined;
      });
      const acceptedEstimates = estimates.filter(e => this.resolveEstimateStatus(e.status) === EstimateStatus.Accepted);
      const openJobs = jobs.filter(j => !this.isJobDone(j));
      const unpaidInvoices = invoices.filter(i => {
         const status = this.resolveInvoiceStatus(i.status);
         return status !== InvoiceStatus.Paid && status !== InvoiceStatus.Refunded;
      });

      return [
         {
            id: 'wf-estimates',
            label: 'Estimates',
            count: pendingEstimates.length,
            detail: `${acceptedEstimates.length} accepted`,
            tone: 'orange',
            route: '/admin/estimates'
         },
         {
            id: 'wf-quotes',
            label: 'Quotes',
            count: acceptedEstimates.length,
            detail: `${this.formatCurrency(this.kpiMetrics.acceptedEstimateValue)} value`,
            tone: 'red',
            route: '/admin/estimates'
         },
         {
            id: 'wf-jobs',
            label: 'Jobs',
            count: openJobs.length,
            detail: `${this.kpiMetrics.jobsInProgress} in progress`,
            tone: 'green',
            route: '/admin/jobs'
         },
         {
            id: 'wf-invoices',
            label: 'Invoices',
            count: unpaidInvoices.length,
            detail: `${this.formatCurrency(this.kpiMetrics.outstandingBalance)} outstanding`,
            tone: 'blue',
            route: '/admin/invoices'
         }
      ];
   }

   private buildAppointmentStats(jobs: Job[]): AppointmentStats {
      const assignments = jobs.flatMap(job => job.assignments ?? []);
      const today = new Date();
      const todayAssignments = assignments.filter(a => this.isSameDay(a.scheduledStart, today));
      const active = todayAssignments.filter(a => this.assignmentStatusIs(a.status, 'inprogress'));
      const completed = todayAssignments.filter(a => this.assignmentStatusIs(a.status, 'completed'));
      const overdue = todayAssignments.filter(a => {
         if (this.assignmentStatusIs(a.status, 'completed') || this.assignmentStatusIs(a.status, 'canceled') || this.assignmentStatusIs(a.status, 'skipped')) return false;
         if (!a.scheduledEnd) return false;
         return new Date(a.scheduledEnd).getTime() < Date.now();
      });
      const remaining = todayAssignments.length - active.length - completed.length - overdue.length;

      return {
         total: todayAssignments.length,
         active: active.length,
         completed: completed.length,
         overdue: overdue.length,
         remaining: Math.max(0, remaining)
      };
   }

   private isSameDay(value: Date | string | undefined, compare: Date): boolean {
      if (!value) return false;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return false;

      return parsed.getFullYear() === compare.getFullYear()
         && parsed.getMonth() === compare.getMonth()
         && parsed.getDate() === compare.getDate();
   }

   private isWithinDays(value: string | Date | undefined, days: number): boolean {
      if (!value) return false;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return false;

      const now = Date.now();
      const diff = now - parsed.getTime();
      return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
   }

   private assignmentStatusIs(status: string | undefined, target: string): boolean {
      if (!status) return false;
      const normalized = status.replace(/\s+/g, '').toLowerCase();
      return normalized === target;
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
            const occurredAt = this.resolveInvoiceActivityDate(invoice);

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
      return [...this.realtimeActivity, ...this.revisionActivity, ...base]
         .sort((left, right) => this.dateScore(right.occurredAt) - this.dateScore(left.occurredAt))
         .slice(0, 8);
   }

   private buildEmptyKpiMetrics(): DashboardKpiMetrics {
      return {
         revenue30: 0,
         outstandingBalance: 0,
         overdueBalance: 0,
         overdueCount: 0,
         paidInvoices: 0,
         sentInvoices: 0,
         openJobs: 0,
         draftJobs: 0,
         jobsWithoutSchedule: 0,
         jobsInProgress: 0,
         assignmentsToday: 0,
         assignmentsInProgress: 0,
         assignmentsCompleted: 0,
         acceptedEstimateValue: 0,
         revisionRequests: 0,
         totalCustomers: 0
      };
   }

   private resolveInvoicePaidAt(invoice: Invoice): string | undefined {
      const withDates: InvoiceWithDates = invoice;
      return withDates.paidAt ?? withDates.updatedAt;
   }

   private resolveInvoiceActivityDate(invoice: Invoice): string | undefined {
      const withDates: InvoiceWithDates = invoice;
      return withDates.updatedAt ?? withDates.paidAt ?? invoice.invoiceDate ?? invoice.dueDate;
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

   private addChatMessageActivity(payload: { clientId: string; clientName: string; messagePreview: string; sentAt: string }): void {
      const id = `chat-${payload.clientId}-${payload.sentAt}`;
      if (this.realtimeActivity.some(item => item.id === id)) return;

      this.realtimeActivity = [{
         id,
         type: 'client-chat-message' as const,
         title: `Message from ${payload.clientName}`,
         detail: payload.messagePreview || 'New message received.',
         occurredAt: payload.sentAt,
         route: '/admin/messages'
      }, ...this.realtimeActivity].slice(0, 8);

      this.clientActivity = this.mergeClientActivity();
   }

   private addJobUpdateActivity(payload: { jobId: string; jobTitle: string; clientId: string; clientName: string; message: string; occurredAt: string }): void {
      const id = `job-update-${payload.jobId}-${payload.occurredAt}`;
      if (this.realtimeActivity.some(item => item.id === id)) return;

      this.realtimeActivity = [{
         id,
         type: 'client-job-update' as const,
         title: `${payload.clientName} updated "${payload.jobTitle}"`,
         detail: payload.message || 'Client posted a job update.',
         occurredAt: payload.occurredAt,
         route: '/admin/jobs'
      }, ...this.realtimeActivity].slice(0, 8);

      this.clientActivity = this.mergeClientActivity();
   }

   onChecklistCompleted(): void {
      this.checklistCompleted = true;
      this.showOnboardingChecklist = false;

      if (!this.organizationId) {
         return;
      }

      this.onboardingService.completeOnboarding()
         .pipe(takeUntil(this.destroy$))
         .subscribe({
            next: (org) => {
               if (org) {
                  this.orgContext.setOrganization(org);
               }
               this.cdr.markForCheck();
            },
            error: () => {
               this.organizationService.getOrganizationById({ organizationId: this.organizationId! })
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                     next: (org) => {
                        if (org) {
                           this.orgContext.setOrganization(org);
                        }
                        this.cdr.markForCheck();
                     }
                  });
            }
         });
   }

   private syncOnboardingCompletion(organizationId: string): void {
      if (this.onboardingSyncOrgId === organizationId) {
         return;
      }

      this.onboardingSyncOrgId = organizationId;
      this.onboardingService.completeOnboarding()
         .pipe(takeUntil(this.destroy$))
         .subscribe({
            next: (org) => {
               if (org) {
                  this.orgContext.setOrganization(org);
               }
               this.cdr.markForCheck();
            },
            error: () => {
               this.onboardingSyncOrgId = null;
               this.cdr.markForCheck();
            }
         });
   }

   private refreshDashboardAfterPayment(): void {
      if (!this.organizationId) {
         return;
      }

      this.loadDashboard();
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
         case 'refunded':
            return InvoiceStatus.Refunded;
         default:
            return InvoiceStatus.Draft;
      }
   }

   private resolvePaidAmount(invoice: Invoice): number {
      const amountPaid = Number(invoice.amountPaid ?? 0);
      if (amountPaid > 0) {
         return amountPaid;
      }

      const total = Number(invoice.totalAmount ?? 0);
      const balance = Number(invoice.balanceDue ?? 0);
      const derived = total - balance;
      if (derived > 0) {
         return derived;
      }

      return total;
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
