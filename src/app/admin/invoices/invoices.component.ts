import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterModule} from '@angular/router';
import {CreateInvoiceLineItemRequest, CreateInvoiceRequest, Invoice, InvoiceStatus} from '../../models/invoice';
import {InvoiceService} from './services/invoice.service';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';
import {JobflowGridColumn, JobflowGridComponent, JobflowGridPageSettings} from '../../common/jobflow-grid/jobflow-grid.component';
import {JobflowDrawerComponent} from '../../common/jobflow-drawer/jobflow-drawer.component';
import {ToastService} from '../../common/toast/toast.service';
import {Job, JobLifecycleStatus, JobLifecycleStatusLabels} from '../jobs/models/job';
import { WorkflowSettingsService } from '../settings/services/workflow-settings.service';
import { WorkflowStatusDto } from '../settings/models/workflow-status';
import {JobsService} from '../jobs/services/jobs.service';
import {formatDateTime} from '../../common/utils/app-formaters';
import {Estimate, EstimateLineItem} from '../estimates/models/estimate';
import {EstimateService} from '../estimates/services/estimate.service';
import {InputTextModule} from 'primeng/inputtext';
import {InputNumberModule} from 'primeng/inputnumber';
import { Auth } from '@angular/fire/auth';
import { useNotifierHub, InvoicePaidEvent } from '../services/useNotifierHub';

@Component({
   selector: 'app-invoices',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule,
      InputTextModule,
      InputNumberModule,
      PageHeaderComponent,
      JobflowGridComponent,
      JobflowDrawerComponent
   ],
   templateUrl: './invoices.component.html',
   styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit, OnDestroy {
   private fb = inject(FormBuilder);
   private invoiceService = inject(InvoiceService);
   private jobsService = inject(JobsService);
   private estimateService = inject(EstimateService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private toast = inject(ToastService);
   private workflowSettings = inject(WorkflowSettingsService);
   private auth = inject(Auth);


   @ViewChild('clientTemplate', {static: true})
   clientTemplate!: TemplateRef<unknown>;

   @ViewChild('statusTemplate', {static: true})
   statusTemplate!: TemplateRef<unknown>;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<unknown>;

   columns: JobflowGridColumn[] = [];
   items: Invoice[] = [];

   headerActions = [
      {
         label: 'Create Invoice',
         icon: 'plus-circle',
         class: 'btn-primary px-4 fw-semibold',
         click: () => this.openCreateInvoiceDrawer()
      }
   ];

   recentJobs: Job[] = [];
   jobSearchText = '';
   jobPickerError: string | null = null;
   isInvoiceOnboardingFlow = false;
   error: string | null = null;
   returnToCommandCenter = false;

   isCreateDrawerOpen = false;
   selectedJob: Job | null = null;
   prefillEstimate: Estimate | null = null;
   createInvoiceError: string | null = null;
   creatingInvoice = false;
   invoiceForm!: FormGroup;

   private prefillEstimates: Estimate[] = [];
   private isEstimatePrefillLoaded = false;
   private isLoadingEstimatePrefill = false;

   private statusLabelMap: Record<number, string> = { ...JobLifecycleStatusLabels };

   private notifierHub: ReturnType<typeof useNotifierHub> | null = null;

   pageSettings: JobflowGridPageSettings = {
      pageSize: 20,
      pageSizes: [10, 20, 50, 100]
   };

   ngOnInit(): void {
      this.returnToCommandCenter = this.route.snapshot.queryParamMap.get('returnTo') === 'dashboard-command-center';
      this.isInvoiceOnboardingFlow = this.route.snapshot.queryParamMap.get('onboardingAction') === 'select-job-for-invoice';

      this.buildColumns();
      this.buildInvoiceForm();
      this.loadWorkflowStatuses();
      this.load();
      this.loadRecentJobs();

      this.notifierHub = useNotifierHub(this.auth, {
         onInvoicePaid: (payload) => this.applyInvoicePaid(payload)
      });
      void this.notifierHub.connect();

      if (this.isInvoiceOnboardingFlow) {
         this.openCreateInvoiceDrawer();
      }
   }

   ngOnDestroy(): void {
      void this.notifierHub?.disconnect();
   }

   private loadWorkflowStatuses(): void {
      this.workflowSettings.getJobStatuses().subscribe({
         next: (statuses) => this.applyWorkflowStatuses(statuses),
         error: () => this.applyWorkflowStatuses(this.buildDefaultWorkflowStatuses())
      });
   }

   private applyWorkflowStatuses(statuses: WorkflowStatusDto[]): void {
      const map: Record<number, string> = {};
      statuses
         .slice()
         .sort((a, b) => a.sortOrder - b.sortOrder)
         .forEach(status => {
            const enumValue = JobLifecycleStatus[status.statusKey as keyof typeof JobLifecycleStatus];
            if (typeof enumValue === 'number') {
               map[enumValue] = status.label;
            }
         });

      if (Object.keys(map).length === 0) {
         this.applyWorkflowStatuses(this.buildDefaultWorkflowStatuses());
         return;
      }

      this.statusLabelMap = map;
   }

   private buildDefaultWorkflowStatuses(): WorkflowStatusDto[] {
      return Object.values(JobLifecycleStatus)
         .filter(value => typeof value === 'number')
         .map(value => value as number)
         .sort((a, b) => a - b)
         .map((value, index) => ({
            statusKey: JobLifecycleStatus[value as JobLifecycleStatus],
            label: JobLifecycleStatusLabels[value as JobLifecycleStatus],
            sortOrder: index
         }));
   }

   get filteredRecentJobs(): Job[] {
      const term = this.jobSearchText.trim().toLowerCase();

      if (!term) {
         return this.recentJobs;
      }

      return this.recentJobs.filter(job => {
         const title = job.title?.toLowerCase() ?? '';
         const firstName = job.organizationClient?.firstName?.toLowerCase() ?? '';
         const lastName = job.organizationClient?.lastName?.toLowerCase() ?? '';
         return title.includes(term) || firstName.includes(term) || lastName.includes(term);
      });
   }

   get invoiceLineItems(): FormArray {
      return this.invoiceForm.get('lineItems') as FormArray;
   }

   get invoiceTotal(): number {
      return this.invoiceLineItems.controls.reduce((sum, ctrl) => {
         const quantity = Number(ctrl.get('quantity')?.value ?? 0);
         const unitPrice = Number(ctrl.get('unitPrice')?.value ?? 0);
         return sum + quantity * unitPrice;
      }, 0);
   }

   private buildColumns(): void {
      this.columns = [
         {
            field: 'invoiceNumber',
            headerText: 'Invoice #',
            width: 130
         },
         {
            headerText: 'Client',
            width: 220,
            sortField: 'organizationClient.firstName',
            searchFields: ['organizationClient.firstName', 'organizationClient.lastName', 'organizationClient.emailAddress'],
            template: this.clientTemplate
         },
         {
            field: 'invoiceDate',
            headerText: 'Invoice Date',
            width: 140,
            valueAccessor: (_field: string, data: unknown) => this.formatDate((data as Invoice)?.invoiceDate)
         },
         {
            field: 'dueDate',
            headerText: 'Due Date',
            width: 140,
            valueAccessor: (_field: string, data: unknown) => this.formatDate((data as Invoice)?.dueDate)
         },
         {
            field: 'totalAmount',
            headerText: 'Total',
            width: 120,
            textAlign: 'Right',
            valueAccessor: (_field: string, data: unknown) => this.formatCurrency((data as Invoice)?.totalAmount)
         },
         {
            field: 'balanceDue',
            headerText: 'Balance',
            width: 120,
            textAlign: 'Right',
            valueAccessor: (_field: string, data: unknown) => this.formatCurrency((data as Invoice)?.balanceDue)
         },
         {
            headerText: 'Status',
            width: 120,
            sortField: 'status',
            searchFields: ['status'],
            template: this.statusTemplate
         },
         {
            headerText: 'Actions',
            width: 120,
            template: this.actionsTemplate,
            textAlign: 'Right'
         }
      ];
   }

   load(): void {
      this.invoiceService.getByOrganization().subscribe({
         next: (list) => {
            this.items = (list ?? []).sort((left, right) => {
               const leftDate = new Date(left.invoiceDate).getTime();
               const rightDate = new Date(right.invoiceDate).getTime();
               return rightDate - leftDate;
            });
         },
         error: (e) => {
            this.error = 'Failed to load invoices.';
            this.toast.error('Failed to load invoices');
            console.error(e);
         }
      });
   }

   private applyInvoicePaid(payload: InvoicePaidEvent): void {
      const target = this.items.find(item => item.id === payload.invoiceId);
      if (!target) {
         return;
      }

      target.status = payload.status as InvoiceStatus;
      target.amountPaid = payload.amountPaid ?? target.amountPaid;
      target.balanceDue = payload.balanceDue ?? target.balanceDue;
      if (payload.paidAt) {
         target.paidAt = payload.paidAt;
      }
   }

   loadRecentJobs(): void {
      this.jobsService.getAllJobs().subscribe({
         next: (jobs) => {
            this.recentJobs = this.sortByMostRecent(jobs ?? []);
            this.jobPickerError = null;
         },
         error: (e) => {
            this.recentJobs = [];
            this.jobPickerError = 'Unable to load jobs right now.';
            this.toast.error('Failed to load jobs for invoice selection');
            console.error(e);
         }
      });
   }

   openCreateInvoiceDrawer(): void {
      this.isCreateDrawerOpen = true;
      this.selectedJob = null;
      this.prefillEstimate = null;
      this.createInvoiceError = null;
      this.jobSearchText = '';
      this.resetInvoiceForm();

      this.loadEstimatePrefills();
   }

   onCreateDrawerClosed(): void {
      this.closeCreateInvoiceDrawer({navigateToCommandCenter: true});
   }

   closeCreateInvoiceDrawer(options?: { navigateToCommandCenter?: boolean }): void {
      this.isCreateDrawerOpen = false;
      this.selectedJob = null;
      this.prefillEstimate = null;
      this.createInvoiceError = null;
      this.creatingInvoice = false;
      this.resetInvoiceForm();

      if (options?.navigateToCommandCenter && this.returnToCommandCenter && this.isInvoiceOnboardingFlow) {
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
      }
   }

   selectJobForInvoice(job: Job): void {
      this.selectedJob = job;
      this.createInvoiceError = null;
      this.applyEstimatePrefill(job);
   }

   backToJobPicker(): void {
      this.selectedJob = null;
      this.prefillEstimate = null;
      this.createInvoiceError = null;
      this.resetInvoiceForm();
   }

   addInvoiceLine(): void {
      this.invoiceLineItems.push(this.newLineItemGroup());
   }

   removeInvoiceLine(index: number): void {
      if (this.invoiceLineItems.length > 1) {
         this.invoiceLineItems.removeAt(index);
      }
   }

   invoiceLineTotal(index: number): number {
      const line = this.invoiceLineItems.at(index);
      const quantity = Number(line.get('quantity')?.value ?? 0);
      const unitPrice = Number(line.get('unitPrice')?.value ?? 0);
      return quantity * unitPrice;
   }

   createInvoice(): void {
      if (!this.selectedJob || this.invoiceForm.invalid || this.creatingInvoice) {
         return;
      }

      this.creatingInvoice = true;
      this.createInvoiceError = null;

      const value = this.invoiceForm.getRawValue() as {
         invoiceDate: string | null;
         dueDate: string | null;
         lineItems: {
            description: string | null;
            quantity: number | null;
            unitPrice: number | null;
         }[];
      };
      const lineItems: CreateInvoiceLineItemRequest[] = (value.lineItems ?? []).map(line => ({
         description: String(line.description ?? '').trim(),
         quantity: Number(line.quantity ?? 0),
         unitPrice: Number(line.unitPrice ?? 0)
      }));

      const payload: CreateInvoiceRequest = {
         jobId: this.selectedJob.id,
         invoiceDate: value.invoiceDate || undefined,
         dueDate: value.dueDate || undefined,
         lineItems
      };

      this.invoiceService.upsertForOrganization(payload).subscribe({
         next: () => {
            this.creatingInvoice = false;
            this.toast.success('Invoice created successfully.');
            this.load();
            this.closeCreateInvoiceDrawer({navigateToCommandCenter: true});
         },
         error: (e) => {
            this.creatingInvoice = false;
            this.createInvoiceError = 'Failed to create invoice. Please review details and try again.';
            this.toast.error('Failed to create invoice.');
            console.error(e);
         }
      });
   }

   trackByJobId(_index: number, job: Job): string {
      return job.id;
   }

   getJobClientName(job: Job | null | undefined): string {
      if (!job) {
         return 'Unknown client';
      }

      const firstName = job.organizationClient?.firstName?.trim() ?? '';
      const lastName = job.organizationClient?.lastName?.trim() ?? '';
      return `${firstName} ${lastName}`.trim() || 'Unknown client';
   }

   getJobStatusLabel(job: Job | null | undefined): string {
      if (!job) {
         return 'Unknown';
      }

      const status = this.resolveJobStatus(job.lifecycleStatus);
      return status === null ? 'Unknown' : (this.statusLabelMap[status] ?? JobLifecycleStatusLabels[status]);
   }

   getJobStatusClass(job: Job | null | undefined): string {
      if (!job) {
         return 'job-status-chip--default';
      }

      const status = this.resolveJobStatus(job.lifecycleStatus);

      switch (status) {
         case JobLifecycleStatus.Draft:
            return 'job-status-chip--draft';
         case JobLifecycleStatus.Approved:
            return 'job-status-chip--approved';
         case JobLifecycleStatus.InProgress:
            return 'job-status-chip--inprogress';
         case JobLifecycleStatus.Completed:
            return 'job-status-chip--completed';
         case JobLifecycleStatus.Cancelled:
            return 'job-status-chip--cancelled';
         case JobLifecycleStatus.Failed:
            return 'job-status-chip--failed';
         default:
            return 'job-status-chip--default';
      }
   }

   formatJobDate(value: string | Date | null | undefined): string {
      return formatDateTime(value);
   }

   formatMoney(value: number): string {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD'
      }).format(value || 0);
   }

   getClientName(invoice: Invoice): string {
      const firstName = invoice.organizationClient?.firstName?.trim() ?? '';
      const lastName = invoice.organizationClient?.lastName?.trim() ?? '';
      return `${firstName} ${lastName}`.trim() || '—';
   }

   getClientEmail(invoice: Invoice): string {
      return invoice.organizationClient?.emailAddress?.trim() || 'No email';
   }

   getStatusLabel(invoice: Invoice): string {
      const status = this.resolveStatus(invoice.status);

      switch (status) {
         case InvoiceStatus.Draft:
            return 'Draft';
         case InvoiceStatus.Sent:
            return 'Sent';
         case InvoiceStatus.Paid:
            return 'Paid';
         case InvoiceStatus.Overdue:
            return 'Overdue';
         case InvoiceStatus.Unpaid:
            return 'Unpaid';
         default:
            return 'Unknown';
      }
   }

   getStatusClass(invoice: Invoice): string {
      const status = this.resolveStatus(invoice.status);

      switch (status) {
         case InvoiceStatus.Draft:
            return 'status-draft';
         case InvoiceStatus.Sent:
            return 'status-sent';
         case InvoiceStatus.Paid:
            return 'status-paid';
         case InvoiceStatus.Overdue:
            return 'status-overdue';
         case InvoiceStatus.Unpaid:
            return 'status-unpaid';
         default:
            return 'status-unknown';
      }
   }

   openInvoice(invoice: Invoice): void {
      this.router.navigate(['/invoice/view', invoice.id], {
         queryParams: this.returnToCommandCenter ? { returnTo: 'dashboard-command-center' } : undefined
      });
   }

   private resolveStatus(rawStatus: InvoiceStatus | number | string): InvoiceStatus | null {
      if (typeof rawStatus === 'number' && InvoiceStatus[rawStatus] !== undefined) {
         return rawStatus as InvoiceStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = InvoiceStatus[rawStatus as keyof typeof InvoiceStatus];
         if (typeof enumValue === 'number') {
            return enumValue;
         }

         const numericValue = Number(rawStatus);
         if (!Number.isNaN(numericValue) && InvoiceStatus[numericValue] !== undefined) {
            return numericValue as InvoiceStatus;
         }
      }

      return null;
   }

   private formatDate(value: string | null | undefined): string {
      if (!value) {
         return '—';
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return '—';
      }

      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   }

   private formatCurrency(value: number | null | undefined): string {
      const normalizedValue = Number(value ?? 0);
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD'
      }).format(normalizedValue);
   }

   private buildInvoiceForm(): void {
      this.invoiceForm = this.fb.group({
         invoiceDate: [this.toDateInputValue(new Date()), Validators.required],
         dueDate: [this.toDateInputValue(this.addDays(new Date(), 14)), Validators.required],
         lineItems: this.fb.array([this.newLineItemGroup()])
      });
   }

   private resetInvoiceForm(): void {
      this.invoiceForm.patchValue({
         invoiceDate: this.toDateInputValue(new Date()),
         dueDate: this.toDateInputValue(this.addDays(new Date(), 14))
      });
      this.replaceInvoiceLineItems([
         {
            description: '',
            quantity: 1,
            unitPrice: 0
         }
      ]);
      this.invoiceForm.markAsPristine();
      this.invoiceForm.markAsUntouched();
   }

   private newLineItemGroup(item?: Partial<CreateInvoiceLineItemRequest>): FormGroup {
      return this.fb.group({
         description: [item?.description ?? '', Validators.required],
         quantity: [item?.quantity ?? 1, [Validators.required, Validators.min(0.001)]],
         unitPrice: [item?.unitPrice ?? 0, [Validators.required, Validators.min(0)]]
      });
   }

   private replaceInvoiceLineItems(lines: CreateInvoiceLineItemRequest[]): void {
      const normalizedLines = lines.length ? lines : [{description: '', quantity: 1, unitPrice: 0}];
      this.invoiceForm.setControl('lineItems', this.fb.array(normalizedLines.map(line => this.newLineItemGroup(line))));
   }

   private loadEstimatePrefills(onLoaded?: () => void): void {
      if (this.isEstimatePrefillLoaded || this.isLoadingEstimatePrefill) {
         onLoaded?.();
         return;
      }

      this.isLoadingEstimatePrefill = true;
      this.estimateService.getByOrganization().subscribe({
         next: (estimates) => {
            this.prefillEstimates = estimates ?? [];
            this.isEstimatePrefillLoaded = true;
            this.isLoadingEstimatePrefill = false;
            onLoaded?.();
         },
         error: (e) => {
            this.prefillEstimates = [];
            this.isEstimatePrefillLoaded = true;
            this.isLoadingEstimatePrefill = false;
            console.error(e);
            onLoaded?.();
         }
      });
   }

   private applyEstimatePrefill(job: Job): void {
      if (!this.isEstimatePrefillLoaded) {
         this.loadEstimatePrefills(() => {
            if (this.selectedJob?.id === job.id) {
               this.applyEstimatePrefill(job);
            }
         });
         return;
      }

      const estimate = this.findEstimateForJob(job.id);
      this.prefillEstimate = estimate;

      if (!estimate?.lineItems?.length) {
         this.replaceInvoiceLineItems([
            {
               description: '',
               quantity: 1,
               unitPrice: 0
            }
         ]);
         return;
      }

      const lines = estimate.lineItems.map(line => this.mapEstimateLineToInvoiceLine(line));
      this.replaceInvoiceLineItems(lines);
   }

   private mapEstimateLineToInvoiceLine(line: EstimateLineItem): CreateInvoiceLineItemRequest {
      return {
         description: (line.description ?? line.name ?? 'Line item').trim(),
         quantity: Number(line.quantity && line.quantity > 0 ? line.quantity : 1),
         unitPrice: Number(line.unitPrice ?? 0)
      };
   }

   private findEstimateForJob(jobId: string): Estimate | null {
      const matches = this.prefillEstimates.filter(estimate => this.extractEstimateJobId(estimate) === jobId);

      if (!matches.length) {
         return null;
      }

      return [...matches].sort((left, right) => this.getEstimateTimestamp(right) - this.getEstimateTimestamp(left))[0];
   }

   private extractEstimateJobId(estimate: Estimate): string | null {
      const estimateWithJob = estimate as Estimate & {
         jobId?: string;
         orderId?: string;
         relatedJobId?: string;
         workOrderId?: string;
         job?: { id?: string };
      };

      const candidates = [
         estimateWithJob.jobId,
         estimateWithJob.orderId,
         estimateWithJob.relatedJobId,
         estimateWithJob.workOrderId,
         estimateWithJob.job?.id
      ];

      return candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0) ?? null;
   }

   private getEstimateTimestamp(estimate: Estimate): number {
      const dates = [estimate.updatedAt, estimate.createdAt, estimate.estimateDate];

      for (const date of dates) {
         const timestamp = this.toTimestamp(date);
         if (timestamp !== null) {
            return timestamp;
         }
      }

      return 0;
   }

   private addDays(value: Date, days: number): Date {
      const result = new Date(value);
      result.setDate(result.getDate() + days);
      return result;
   }

   private toDateInputValue(value: Date): string {
      return value.toISOString().slice(0, 10);
   }

   private sortByMostRecent(list: Job[]): Job[] {
      return [...list].sort((left, right) => this.getMostRecentTimestamp(right) - this.getMostRecentTimestamp(left));
   }

   private getMostRecentTimestamp(job: Job): number {
      const jobWithMeta = job as Job & {
         createdAt?: string;
         createdOn?: string;
         updatedAt?: string;
      };

      const candidates: (string | Date | null | undefined)[] = [
         job.scheduledStart,
         jobWithMeta.updatedAt,
         jobWithMeta.createdAt,
         jobWithMeta.createdOn
      ];

      for (const candidate of candidates) {
         const timestamp = this.toTimestamp(candidate);
         if (timestamp !== null) {
            return timestamp;
         }
      }

      return 0;
   }

   private toTimestamp(value: string | Date | null | undefined): number | null {
      if (!value) {
         return null;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return null;
      }

      return date.getTime();
   }

   private resolveJobStatus(rawStatus: JobLifecycleStatus | number | string): JobLifecycleStatus | null {
      if (typeof rawStatus === 'number' && this.statusLabelMap[rawStatus as JobLifecycleStatus]) {
         return rawStatus as JobLifecycleStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = JobLifecycleStatus[rawStatus as keyof typeof JobLifecycleStatus];
         if (typeof enumValue === 'number') {
            return enumValue;
         }

         const numericValue = Number(rawStatus);
         if (!Number.isNaN(numericValue) && this.statusLabelMap[numericValue as JobLifecycleStatus]) {
            return numericValue as JobLifecycleStatus;
         }
      }

      return null;
   }
}