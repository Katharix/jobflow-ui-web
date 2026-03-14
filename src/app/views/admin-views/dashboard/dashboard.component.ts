import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { OrganizationDto } from '../../../models/organization';
import { Invoice, InvoiceStatus } from '../../../models/invoice';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { InvoiceService } from '../../../services/invoice.service';
import { OnboardingChecklistComponent } from '../../general/onboarding-checklist/onboarding-checklist.component';
import { JobsService } from '../../../admin/jobs/services/jobs.service';
import { Job, JobLifecycleStatus } from '../../../admin/jobs/models/job';
import { CustomersService } from '../../../admin/customer/services/customer.service';
import { EmployeeService } from '../../../admin/employees/services/employee.service';
import { Employee } from '../../../admin/employees/models/employee';

interface DashboardKpi {
   label: string;
   value: string;
   helper: string;
   tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

interface DashboardAction {
   label: string;
   description: string;
   route: string;
   icon: string;
}

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule, OnboardingChecklistComponent],
   templateUrl: './dashboard.component.html',
   styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
   organizationId: string | null = null;
   org: OrganizationDto | null = null;

   isLoading = true;
      onboardingComplete = false;
   loadWarning: string | null = null;
   lastUpdated: Date | null = null;

   kpis: DashboardKpi[] = [];
   quickActions: DashboardAction[] = [
      {
         label: 'Create job',
         description: 'Schedule new work quickly',
         route: '/admin/jobs',
         icon: 'pi pi-briefcase'
      },
      {
         label: 'Add customer',
         description: 'Create a client profile',
         route: '/admin/clients/create',
         icon: 'pi pi-users'
      },
      {
         label: 'Send invoice',
         description: 'Get paid faster',
         route: '/admin/invoices',
         icon: 'pi pi-receipt'
      },
      {
         label: 'Manage team',
         description: 'Add or update employees',
         route: '/admin/employees',
         icon: 'pi pi-id-card'
      }
   ];

   upcomingJobs: Job[] = [];
   todayJobs: Job[] = [];
   overdueJobs: Job[] = [];
   invoiceAttention: Invoice[] = [];
   recentInvoices: Invoice[] = [];

   activeEmployees = 0;
   invoiceCollectionRate = 0;
   outstandingBalance = 0;

   private readonly destroy$ = new Subject<void>();

   constructor(
      private readonly orgContext: OrganizationContextService,
      private readonly jobsService: JobsService,
      private readonly invoiceService: InvoiceService,
      private readonly customersService: CustomersService,
      private readonly employeeService: EmployeeService
   ) {}

   ngOnInit(): void {
      this.orgContext.org$
         .pipe(takeUntil(this.destroy$))
         .subscribe(org => {
            this.org = org;
            this.organizationId = org?.id ?? null;

            if (!this.organizationId) {
               this.setEmptyState();
               this.isLoading = false;
               return;
            }

            this.loadDashboard();
         });
   }

   ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
   }

   refresh(): void {
      if (!this.organizationId) return;
      this.loadDashboard();
   }

   private loadDashboard(): void {
      this.isLoading = true;
      this.loadWarning = null;

      forkJoin({
         jobs: this.jobsService.getAllJobs().pipe(catchError(() => of([] as Job[]))),
         invoices: this.invoiceService.getByOrganization().pipe(catchError(() => of([] as Invoice[]))),
         customers: this.customersService.getAllByOrganization().pipe(catchError(() => of([] as any[]))),
         employees: this.employeeService.getByOrganization().pipe(catchError(() => of([] as Employee[])))
      })
         .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.isLoading = false))
         )
         .subscribe(({ jobs, invoices, customers, employees }) => {
            this.buildDashboardState(jobs, invoices, customers, employees);
            this.lastUpdated = new Date();

            const hadPartialFailures = [jobs, invoices, customers, employees].some(list => !Array.isArray(list));
            this.loadWarning = hadPartialFailures ? 'Some dashboard data could not be loaded.' : null;
         });
   }

   private buildDashboardState(jobs: Job[], invoices: Invoice[], customers: any[], employees: Employee[]): void {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const openJobs = jobs.filter(job => !this.isJobDone(job));
      this.todayJobs = openJobs
         .filter(job => this.toDate(job.scheduledStart) >= startOfToday && this.toDate(job.scheduledStart) <= endOfToday)
         .sort((a, b) => this.toDate(a.scheduledStart).getTime() - this.toDate(b.scheduledStart).getTime())
         .slice(0, 6);

      this.upcomingJobs = openJobs
         .filter(job => this.toDate(job.scheduledStart) > now)
         .sort((a, b) => this.toDate(a.scheduledStart).getTime() - this.toDate(b.scheduledStart).getTime())
         .slice(0, 6);

      this.overdueJobs = openJobs
         .filter(job => this.toDate(job.scheduledEnd || job.scheduledStart) < now)
         .sort((a, b) => this.toDate(a.scheduledStart).getTime() - this.toDate(b.scheduledStart).getTime())
         .slice(0, 6);

      this.invoiceAttention = invoices
         .filter(invoice => this.isInvoiceOverdue(invoice) || (invoice.balanceDue ?? 0) > 0)
         .sort((a, b) => this.toDate(a.dueDate).getTime() - this.toDate(b.dueDate).getTime())
         .slice(0, 6);

      this.recentInvoices = [...invoices]
         .sort((a, b) => this.toDate(b.invoiceDate).getTime() - this.toDate(a.invoiceDate).getTime())
         .slice(0, 5);

      const paidThisMonth = invoices
         .filter(invoice => this.toDate(invoice.invoiceDate) >= startOfMonth)
         .reduce((sum, invoice) => sum + (invoice.amountPaid ?? 0), 0);

      const billedThisMonth = invoices
         .filter(invoice => this.toDate(invoice.invoiceDate) >= startOfMonth)
         .reduce((sum, invoice) => sum + (invoice.totalAmount ?? 0), 0);

      this.outstandingBalance = invoices.reduce((sum, invoice) => sum + Math.max(invoice.balanceDue ?? 0, 0), 0);
      this.invoiceCollectionRate = billedThisMonth > 0 ? Math.round((paidThisMonth / billedThisMonth) * 100) : 0;
      this.activeEmployees = employees.filter(employee => employee.isActive).length;

      this.kpis = [
         {
            label: 'Open jobs',
            value: this.toCount(openJobs.length),
            helper: `${this.todayJobs.length} scheduled today`,
            tone: openJobs.length > 0 ? 'primary' : 'neutral'
         },
         {
            label: 'Overdue jobs',
            value: this.toCount(this.overdueJobs.length),
            helper: 'Need immediate action',
            tone: this.overdueJobs.length > 0 ? 'danger' : 'success'
         },
         {
            label: 'Customers',
            value: this.toCount(customers.length),
            helper: 'Total client records',
            tone: 'neutral'
         },
         {
            label: 'Active team',
            value: this.toCount(this.activeEmployees),
            helper: `${employees.length} total employees`,
            tone: 'primary'
         },
         {
            label: 'Outstanding balance',
            value: this.toCurrency(this.outstandingBalance),
            helper: `${this.invoiceAttention.length} invoices need attention`,
            tone: this.outstandingBalance > 0 ? 'warning' : 'success'
         },
         {
            label: 'Collection rate',
            value: `${this.invoiceCollectionRate}%`,
            helper: 'This month',
            tone: this.invoiceCollectionRate >= 80 ? 'success' : 'warning'
         }
      ];
   }

   private setEmptyState(): void {
      this.kpis = [
         { label: 'Open jobs', value: '0', helper: 'No organization selected', tone: 'neutral' },
         { label: 'Overdue jobs', value: '0', helper: 'No organization selected', tone: 'neutral' },
         { label: 'Customers', value: '0', helper: 'No organization selected', tone: 'neutral' },
         { label: 'Active team', value: '0', helper: 'No organization selected', tone: 'neutral' },
         { label: 'Outstanding balance', value: '$0', helper: 'No organization selected', tone: 'neutral' },
         { label: 'Collection rate', value: '0%', helper: 'No organization selected', tone: 'neutral' }
      ];

      this.upcomingJobs = [];
      this.todayJobs = [];
      this.overdueJobs = [];
      this.invoiceAttention = [];
      this.recentInvoices = [];
      this.activeEmployees = 0;
      this.invoiceCollectionRate = 0;
      this.outstandingBalance = 0;
   }

   getInvoiceStatusLabel(invoice: Invoice): string {
      if (this.isInvoiceOverdue(invoice)) return 'Overdue';
      if ((invoice.balanceDue ?? 0) <= 0) return 'Paid';
      return 'Unpaid';
   }

   getInvoiceStatusClass(invoice: Invoice): string {
      if (this.isInvoiceOverdue(invoice)) return 'status-chip status-chip--danger';
      if ((invoice.balanceDue ?? 0) <= 0) return 'status-chip status-chip--success';
      return 'status-chip status-chip--warning';
   }

   trackById(_: number, item: { id: string }): string {
      return item.id;
   }

   private isJobDone(job: Job): boolean {
      return [JobLifecycleStatus.Completed, JobLifecycleStatus.Cancelled, JobLifecycleStatus.Failed].includes(job.lifecycleStatus);
   }

   private isInvoiceOverdue(invoice: Invoice): boolean {
      if (invoice.status === InvoiceStatus.Overdue) return true;
      return (invoice.balanceDue ?? 0) > 0 && this.toDate(invoice.dueDate).getTime() < Date.now();
   }

   private toDate(value: Date | string | null | undefined): Date {
      if (!value) return new Date(0);
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? new Date(0) : date;
   }

   private toCurrency(value: number): string {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD',
         maximumFractionDigits: 0
      }).format(value || 0);
   }

   private toCount(value: number): string {
      return new Intl.NumberFormat('en-US').format(value || 0);
   }
}
