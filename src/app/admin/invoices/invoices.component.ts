import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterModule} from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {CreateInvoiceLineItemRequest, CreateInvoiceRequest, Invoice, InvoiceStatus, UpdateInvoiceRequest} from '../../models/invoice';
import {InvoiceService} from './services/invoice.service';
import {JobflowGridColumn, JobflowGridComponent, JobflowGridPageSettings, JobflowGridSortChangeEvent} from '../../common/jobflow-grid/jobflow-grid.component';
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
import {AutoCompleteModule, AutoCompleteSelectEvent} from 'primeng/autocomplete';
import { Auth } from '@angular/fire/auth';
import { useNotifierHub, InvoicePaidEvent } from '../services/useNotifierHub';
import { BehaviorSubject, Subject, Subscription, asyncScheduler, catchError, debounceTime, distinctUntilChanged, observeOn, of, switchMap, take } from 'rxjs';
import { InvoiceJobPickerComponent, InvoiceJobPickerRow } from './invoice-job-picker/invoice-job-picker.component';
import { PriceBookItemDto, PriceBookItemService } from '../pricebook/services/price-book-item.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { EmptyStateComponent } from '../../common/empty-state/empty-state.component';

@Component({
   selector: 'app-invoices',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule,
      TranslateModule,
      InputTextModule,
      InputNumberModule,
      AutoCompleteModule,
      InvoiceJobPickerComponent,
      JobflowGridComponent,
      EmptyStateComponent
   ],
   templateUrl: './invoices.component.html',
   styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit, OnDestroy {
   private readonly invoicePageSize = 50;

   private fb = inject(FormBuilder);
   private invoiceService = inject(InvoiceService);
   private jobsService = inject(JobsService);
   private estimateService = inject(EstimateService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private toast = inject(ToastService);
   private workflowSettings = inject(WorkflowSettingsService);
   private auth = inject(Auth);
   private translate = inject(TranslateService);
   private priceBookService = inject(PriceBookItemService);
   private orgContext = inject(OrganizationContextService);
   private cdr = inject(ChangeDetectorRef);


   @ViewChild('clientTemplate', {static: true})
   clientTemplate!: TemplateRef<unknown>;

   @ViewChild('statusTemplate', {static: true})
   statusTemplate!: TemplateRef<unknown>;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<unknown>;

   columns: JobflowGridColumn[] = [];
   items: Invoice[] = [];
   displayItems: Invoice[] = [];
   nextCursor: string | null = null;
   private cursorStack: string[] = [];
   listLoading = false;
   totalInvoiceCount: number | null = null;
   searchText = '';
   sortBy = 'createdAt';
   sortDirection: 'asc' | 'desc' = 'desc';

   summary = {
      total: 0,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      unpaid: 0,
      totalBilled: 0,
      balanceDue: 0
   };
   readonly summary$ = new BehaviorSubject(this.summary);

   statusFilters: { key: string; label: string; status?: InvoiceStatus }[] = [];
   selectedStatusFilter = 'all';

   headerActions = [] as { label: string; icon: string; class: string; click: () => void }[];

   recentJobs: Job[] = [];
   filteredRecentJobs: Job[] = [];
   readonly filteredRecentJobRows$ = new BehaviorSubject<InvoiceJobPickerRow[]>([]);
   hasFilteredRecentJobs = false;
   jobSearchText = '';
   hasJobSearchTerm = false;
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

   isEditDrawerOpen = false;
   editingInvoice: Invoice | null = null;
   editInvoiceError: string | null = null;
   editInvoiceForm!: FormGroup;
   savingInvoice = false;

   private prefillEstimates: Estimate[] = [];
   private isEstimatePrefillLoaded = false;
   private isLoadingEstimatePrefill = false;

   priceBookItems: PriceBookItemDto[] = [];
   filteredPriceBookItems: PriceBookItemDto[] = [];
   hasPriceBookAccess = false;

   private statusLabelMap: Record<number, string> = { ...JobLifecycleStatusLabels };
   private reverseLabelMap: Record<string, number> = {};

   private notifierHub: ReturnType<typeof useNotifierHub> | null = null;
   private readonly searchInput$ = new Subject<string>();
   private readonly loadPage$ = new Subject<string | undefined>();
   private searchInputSub?: Subscription;
   private loadPageSub?: Subscription;

   pageSettings: JobflowGridPageSettings = {
      pageSize: 20,
      pageSizes: [10, 20, 50, 100]
   };

   ngOnInit(): void {
      this.returnToCommandCenter = this.route.snapshot.queryParamMap.get('returnTo') === 'dashboard-command-center';
      this.isInvoiceOnboardingFlow = this.route.snapshot.queryParamMap.get('onboardingAction') === 'select-job-for-invoice';

      this.refreshLabels();
      this.buildInvoiceForm();
      this.loadWorkflowStatuses();
      this.loadRecentJobs();
      this.loadPriceBookAccess();

      this.loadPageSub = this.loadPage$
         .pipe(
            switchMap((cursor) => {
               this.listLoading = true;
               const status = this.selectedStatusFilter === 'all'
                  ? undefined
                  : this.statusFilters.find(filter => filter.key === this.selectedStatusFilter)?.status;

               return this.invoiceService.getByOrganizationPaged({
                  cursor,
                  pageSize: this.invoicePageSize,
                  status: typeof status === 'number' ? InvoiceStatus[status] : undefined,
                  search: this.searchText || undefined,
                  sortBy: this.sortBy,
                  sortDirection: this.sortDirection
               }).pipe(
                  catchError((e) => {
                     this.error = this.translate.instant('admin.invoices.errors.load');
                     this.toast.error(this.translate.instant('admin.invoices.toast.loadFailed'));
                     console.error(e);
                     return of(null);
                  })
               );
            })
         )
         .subscribe((page) => {
            this.listLoading = false;
            if (!page) {
               return;
            }

            this.items = page.items ?? [];
            this.totalInvoiceCount = page.totalCount ?? null;
            this.nextCursor = page.nextCursor ?? null;
            this.updateDisplayItems();
            this.cdr.detectChanges();
         });

      this.notifierHub = useNotifierHub(this.auth, {
         onInvoicePaid: (payload) => this.applyInvoicePaid(payload),
         onJobStatusChanged: () => this.load(),
      });
      void this.notifierHub.connect();

      this.searchInputSub = this.searchInput$
         .pipe(debounceTime(300), distinctUntilChanged())
         .subscribe(search => {
            this.searchText = search;
            this.load();
         });

      this.load();

      if (this.isInvoiceOnboardingFlow) {
         this.openCreateInvoiceDrawer();
      }
   }

   ngOnDestroy(): void {
      void this.notifierHub?.disconnect();
      this.searchInputSub?.unsubscribe();
      this.loadPageSub?.unsubscribe();
      this.translateLangSub?.unsubscribe();
   }

   private translateLangSub = this.translate.onLangChange.subscribe(() => {
      this.refreshLabels();
   });

   private refreshLabels(): void {
      this.statusFilters = [
         { key: 'all', label: this.translate.instant('admin.invoices.filters.all') },
         { key: 'draft', label: this.translate.instant('admin.invoices.filters.draft'), status: InvoiceStatus.Draft },
         { key: 'sent', label: this.translate.instant('admin.invoices.filters.sent'), status: InvoiceStatus.Sent },
         { key: 'paid', label: this.translate.instant('admin.invoices.filters.paid'), status: InvoiceStatus.Paid },
         { key: 'overdue', label: this.translate.instant('admin.invoices.filters.overdue'), status: InvoiceStatus.Overdue },
         { key: 'unpaid', label: this.translate.instant('admin.invoices.filters.unpaid'), status: InvoiceStatus.Unpaid }
      ];

      this.headerActions = [
         {
            label: this.translate.instant('admin.invoices.actions.create'),
            icon: 'plus-circle',
            class: 'btn-primary px-4 fw-semibold',
            click: () => this.openCreateInvoiceDrawer()
         }
      ];

      this.buildColumns();
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

      const reverse: Record<string, number> = {};
      for (const [enumVal, label] of Object.entries(map)) {
         reverse[label.toLowerCase()] = Number(enumVal);
      }
      this.reverseLabelMap = reverse;
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

   onJobSearchChange(value: string): void {
      this.jobSearchText = value;
      this.hasJobSearchTerm = value.trim().length > 0;
      this.refreshFilteredRecentJobs();
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



   private updateDisplayItems(): void {
      if (this.selectedStatusFilter === 'all') {
         this.displayItems = this.items;
         return;
      }

      const target = this.statusFilters.find(filter => filter.key === this.selectedStatusFilter);
      if (!target?.status && target?.status !== 0) {
         this.displayItems = this.items;
         return;
      }

      this.displayItems = this.items.filter(invoice => this.resolveStatus(invoice.status) === target.status);
   }

   setStatusFilter(key: string): void {
      this.selectedStatusFilter = key;
      this.updateDisplayItems();
      this.load();
   }

   getFilterCount(key: string): number {
      if (key === 'all') {
         return this.totalInvoiceCount ?? this.summary.total;
      }

      const countMap: Record<string, number> = {
         draft: this.summary.draft,
         sent: this.summary.sent,
         paid: this.summary.paid,
         overdue: this.summary.overdue,
         unpaid: this.summary.unpaid,
      };

      return countMap[key] ?? 0;
   }

   private buildColumns(): void {
      this.columns = [
         {
            field: 'invoiceNumber',
            headerText: this.translate.instant('admin.invoices.table.invoiceNumber'),
            width: 130
         },
         {
            headerText: this.translate.instant('admin.invoices.table.client'),
            width: 220,
            sortField: 'invoiceDate',
            searchFields: ['organizationClient.firstName', 'organizationClient.lastName', 'organizationClient.emailAddress'],
            template: this.clientTemplate
         },
         {
            field: 'invoiceDate',
            headerText: this.translate.instant('admin.invoices.table.invoiceDate'),
            width: 140,
            valueAccessor: (_field: string, data: unknown) => this.formatDate((data as Invoice)?.invoiceDate)
         },
         {
            field: 'dueDate',
            headerText: this.translate.instant('admin.invoices.table.dueDate'),
            width: 140,
            valueAccessor: (_field: string, data: unknown) => this.formatDate((data as Invoice)?.dueDate)
         },
         {
            field: 'totalAmount',
            headerText: this.translate.instant('admin.invoices.table.total'),
            width: 120,
            textAlign: 'Right',
            valueAccessor: (_field: string, data: unknown) => this.formatCurrency((data as Invoice)?.totalAmount)
         },
         {
            field: 'balanceDue',
            headerText: this.translate.instant('admin.invoices.table.balance'),
            width: 120,
            textAlign: 'Right',
            valueAccessor: (_field: string, data: unknown) => this.formatCurrency((data as Invoice)?.balanceDue)
         },
         {
            headerText: this.translate.instant('admin.invoices.table.status'),
            width: 120,
            sortField: 'status',
            searchFields: ['status'],
            template: this.statusTemplate
         },
         {
            headerText: this.translate.instant('admin.invoices.table.actions'),
            width: 120,
            template: this.actionsTemplate,
            textAlign: 'Right'
         }
      ];
   }

   load(cursor?: string): void {
      if (!cursor) {
         this.cursorStack = [];
      }

      this.loadPage$.next(cursor);
      this.loadSummary();
   }

   get canGoBack(): boolean {
      return this.cursorStack.length > 0;
   }

   onNextPage(): void {
      if (!this.nextCursor || this.listLoading) return;
      this.cursorStack.push(this.nextCursor);
      this.load(this.nextCursor);
   }

   onPrevPage(): void {
      if (!this.canGoBack || this.listLoading) return;
      this.cursorStack.pop();
      const previousCursor = this.cursorStack.length > 0
         ? this.cursorStack[this.cursorStack.length - 1]
         : undefined;
      this.load(previousCursor);
   }

   onGridSearchChange(search: string): void {
      this.searchInput$.next(search);
   }

   onGridSortChange(event: JobflowGridSortChangeEvent): void {
      if (!event.field || !event.direction) {
         return;
      }

      this.sortBy = event.field;
      this.sortDirection = event.direction;
      this.load();
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

      this.updateDisplayItems();
      this.cdr.detectChanges();
      this.loadSummary();
   }

   loadRecentJobs(): void {
      this.jobsService.getAllJobs().pipe(observeOn(asyncScheduler)).subscribe({
         next: (jobs) => {
            this.recentJobs = this.sortByMostRecent((jobs ?? []).map(job => this.cloneJob(job)));
            this.refreshFilteredRecentJobs();
            this.jobPickerError = null;
         },
         error: (e) => {
            this.recentJobs = [];
            this.filteredRecentJobs = [];
            this.filteredRecentJobRows$.next([]);
            this.jobPickerError = this.translate.instant('admin.invoices.errors.loadJobs');
            this.toast.error(this.translate.instant('admin.invoices.toast.loadJobsFailed'));
            console.error(e);
         }
      });
   }

   openCreateInvoiceDrawer(): void {
      this.selectedJob = null;
      this.prefillEstimate = null;
      this.createInvoiceError = null;
      this.jobPickerError = null;
      this.jobSearchText = '';
      this.hasJobSearchTerm = false;
      this.refreshFilteredRecentJobs();
      this.resetInvoiceForm();

      this.isCreateDrawerOpen = true;

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

   searchPriceBookItems(event: { query: string }): void {
      const query = (event.query ?? '').toLowerCase();
      this.filteredPriceBookItems = this.priceBookItems.filter(
         item => item.name.toLowerCase().includes(query)
            || (item.description ?? '').toLowerCase().includes(query)
      );
   }

   onPriceBookItemSelected(event: AutoCompleteSelectEvent): void {
      const item: PriceBookItemDto = event.value;
      this.invoiceLineItems.push(this.newLineItemGroup({
         priceBookItemId: item.id,
         description: item.name,
         unitPrice: item.price
      }));
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
            priceBookItemId: string | null;
            description: string | null;
            quantity: number | null;
            unitPrice: number | null;
         }[];
      };
      const lineItems: CreateInvoiceLineItemRequest[] = (value.lineItems ?? []).map(line => ({
         priceBookItemId: line.priceBookItemId || undefined,
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
            this.toast.success(this.translate.instant('admin.invoices.toast.created'));
            this.load();
            this.closeCreateInvoiceDrawer({navigateToCommandCenter: true});
         },
         error: (e) => {
            this.creatingInvoice = false;
            this.createInvoiceError = this.translate.instant('admin.invoices.errors.create');
            this.toast.error(this.translate.instant('admin.invoices.toast.createFailed'));
            console.error(e);
         }
      });
   }

   openEditInvoiceDrawer(invoice: Invoice): void {
      this.editInvoiceError = null;
      this.savingInvoice = false;

      // Fetch full invoice with line items, then open drawer
      this.invoiceService.getInvoice(invoice.id).subscribe({
         next: (full) => {
            this.editingInvoice = full;
            this.buildEditInvoiceForm(full);
            this.isEditDrawerOpen = true;
            this.cdr.detectChanges();
         },
         error: () => {
            this.editingInvoice = invoice;
            this.buildEditInvoiceForm(invoice);
            this.isEditDrawerOpen = true;
            this.cdr.detectChanges();
         }
      });
   }

   onEditDrawerClosed(): void {
      this.isEditDrawerOpen = false;
      this.editingInvoice = null;
      this.editInvoiceError = null;
      this.savingInvoice = false;
   }

   get editLineItems(): FormArray {
      return this.editInvoiceForm.get('lineItems') as FormArray;
   }

   get editInvoiceTotal(): number {
      return this.editLineItems.controls.reduce((sum, ctrl) => {
         const quantity = Number(ctrl.get('quantity')?.value ?? 0);
         const unitPrice = Number(ctrl.get('unitPrice')?.value ?? 0);
         return sum + quantity * unitPrice;
      }, 0);
   }

   editLineTotal(index: number): number {
      const line = this.editLineItems.at(index);
      const quantity = Number(line.get('quantity')?.value ?? 0);
      const unitPrice = Number(line.get('unitPrice')?.value ?? 0);
      return quantity * unitPrice;
   }

   addEditInvoiceLine(): void {
      this.editLineItems.push(this.newLineItemGroup());
   }

   removeEditInvoiceLine(index: number): void {
      if (this.editLineItems.length > 1) {
         this.editLineItems.removeAt(index);
      }
   }

   saveEditInvoice(): void {
      if (!this.editingInvoice || this.editInvoiceForm.invalid || this.savingInvoice) {
         return;
      }

      this.savingInvoice = true;
      this.editInvoiceError = null;

      const value = this.editInvoiceForm.getRawValue() as {
         invoiceDate: string | null;
         dueDate: string | null;
         lineItems: {
            priceBookItemId: string | null;
            description: string | null;
            quantity: number | null;
            unitPrice: number | null;
         }[];
      };

      const lineItems: CreateInvoiceLineItemRequest[] = (value.lineItems ?? []).map(line => ({
         priceBookItemId: line.priceBookItemId || undefined,
         description: String(line.description ?? '').trim(),
         quantity: Number(line.quantity ?? 0),
         unitPrice: Number(line.unitPrice ?? 0)
      }));

      const payload: UpdateInvoiceRequest = {
         invoiceDate: value.invoiceDate || undefined,
         dueDate: value.dueDate || new Date().toISOString(),
         lineItems
      };

      this.invoiceService.updateInvoice(this.editingInvoice.id, payload).subscribe({
         next: () => {
            this.savingInvoice = false;
            this.toast.success(this.translate.instant('admin.invoices.toast.updated'));
            this.load();
            this.onEditDrawerClosed();
         },
         error: (e) => {
            this.savingInvoice = false;
            this.editInvoiceError = this.translate.instant('admin.invoices.errors.update');
            this.toast.error(this.translate.instant('admin.invoices.toast.updateFailed'));
            console.error(e);
         }
      });
   }

   private buildEditInvoiceForm(invoice: Invoice): void {
      const lines = invoice.lineItems?.length
         ? invoice.lineItems.map(li => this.newLineItemGroup({
            priceBookItemId: li.priceBookItemId || undefined,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice
         }))
         : [this.newLineItemGroup()];

      this.editInvoiceForm = this.fb.group({
         invoiceDate: [this.toDateInputValue(new Date(invoice.invoiceDate)), Validators.required],
         dueDate: [this.toDateInputValue(new Date(invoice.dueDate)), Validators.required],
         lineItems: this.fb.array(lines)
      });
   }

   getJobClientName(job: Job | null | undefined): string {
      if (!job) {
         return this.translate.instant('admin.invoices.labels.unknownClient');
      }

      const firstName = job.organizationClient?.firstName?.trim() ?? '';
      const lastName = job.organizationClient?.lastName?.trim() ?? '';
      return `${firstName} ${lastName}`.trim() || 'Unknown client';
   }

   getJobStatusLabel(job: Job | null | undefined): string {
      if (!job) {
         return this.translate.instant('admin.invoices.labels.unknown');
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
         case JobLifecycleStatus.Booked:
            return 'job-status-chip--booked';
         default:
            return 'job-status-chip--default';
      }
   }

   formatJobDate(value: string | Date | null | undefined): string {
      return formatDateTime(value);
   }

   private getEarliestAssignmentStart(job: Job): Date | null {
      const assignments = job.assignments;
      if (!assignments?.length) return job.scheduledStart ?? null;
      const sorted = [...assignments]
         .filter(a => a.scheduledStart)
         .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime());
      return sorted.length ? new Date(sorted[0].scheduledStart!) : null;
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
      return invoice.organizationClient?.emailAddress?.trim() || this.translate.instant('admin.invoices.labels.noEmail');
   }

   getStatusLabel(invoice: Invoice): string {
      const status = this.resolveStatus(invoice.status);

      switch (status) {
         case InvoiceStatus.Draft:
            return this.translate.instant('admin.invoices.status.draft');
         case InvoiceStatus.Sent:
            return this.translate.instant('admin.invoices.status.sent');
         case InvoiceStatus.Paid:
            return this.translate.instant('admin.invoices.status.paid');
         case InvoiceStatus.Overdue:
            return this.translate.instant('admin.invoices.status.overdue');
         case InvoiceStatus.Unpaid:
            return this.translate.instant('admin.invoices.status.unpaid');
         default:
            return this.translate.instant('admin.invoices.labels.unknown');
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
         return this.translate.instant('admin.invoices.labels.missing');
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return this.translate.instant('admin.invoices.labels.missing');
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

   private loadSummary(): void {
      this.invoiceService.getSummary().subscribe({
         next: (dto) => {
            this.summary = {
               total: dto.invoiceCount,
               draft: dto.draftCount,
               sent: dto.sentCount,
               paid: dto.paidCount,
               overdue: dto.overdueCount,
               unpaid: dto.sentCount + dto.overdueCount,
               totalBilled: dto.totalBilled,
               balanceDue: dto.balanceDue
            };
            this.summary$.next(this.summary);
         },
         error: () => { /* summary is non-critical; keep stale values */ }
      });
   }

   private buildInvoiceForm(): void {
      this.invoiceForm = this.fb.group({
         invoiceDate: [this.toDateInputValue(new Date()), Validators.required],
         dueDate: [this.toDateInputValue(this.addDays(new Date(), 14)), Validators.required],
         lineItems: this.fb.array([this.newLineItemGroup()])
      });
      this.editInvoiceForm = this.fb.group({
         invoiceDate: ['', Validators.required],
         dueDate: ['', Validators.required],
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
         priceBookItemId: [item?.priceBookItemId ?? null],
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
         priceBookItemId: line.priceBookItemId || undefined,
         description: (line.description ?? line.name ?? this.translate.instant('admin.invoices.form.lineItemFallback')).trim(),
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

   private refreshFilteredRecentJobs(): void {
      const term = this.jobSearchText.trim().toLowerCase();

      if (!term) {
         this.filteredRecentJobs = [...this.recentJobs];
         const rows = this.buildJobPickerRows(this.filteredRecentJobs);
         this.filteredRecentJobRows$.next(rows);
         this.hasFilteredRecentJobs = rows.length > 0;
         return;
      }

      this.filteredRecentJobs = this.recentJobs.filter(job => {
         const title = job.title?.toLowerCase() ?? '';
         const firstName = job.organizationClient?.firstName?.toLowerCase() ?? '';
         const lastName = job.organizationClient?.lastName?.toLowerCase() ?? '';
         return title.includes(term) || firstName.includes(term) || lastName.includes(term);
      });
      const rows = this.buildJobPickerRows(this.filteredRecentJobs);
      this.filteredRecentJobRows$.next(rows);
      this.hasFilteredRecentJobs = rows.length > 0;
   }

   private buildJobPickerRows(jobs: Job[]): InvoiceJobPickerRow[] {
      return jobs.map(job => {
         const earliest = this.getEarliestAssignmentStart(job);
         return {
            id: job.id,
            job,
            title: job.title?.trim() || this.translate.instant('admin.invoices.drawer.untitledJob'),
            clientName: this.getJobClientName(job),
            scheduledDateText: this.formatJobDate(earliest),
            scheduledDateShort: earliest
               ? new Date(earliest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
               : '',
            statusClass: this.getJobStatusClass(job),
            statusLabel: this.getJobStatusLabel(job)
         };
      });
   }

   private cloneJob(job: Job): Job {
      return {
         ...job,
         organizationClient: job.organizationClient
            ? { ...job.organizationClient }
            : job.organizationClient
      };
   }

   private resolveJobStatus(rawStatus: JobLifecycleStatus | number | string): JobLifecycleStatus | null {
      if (typeof rawStatus === 'number' && this.statusLabelMap[rawStatus as JobLifecycleStatus]) {
         return rawStatus as JobLifecycleStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = JobLifecycleStatus[rawStatus as keyof typeof JobLifecycleStatus];
         if (typeof enumValue === 'number' && this.statusLabelMap[enumValue]) {
            return enumValue;
         }

         const byLabel = this.reverseLabelMap[rawStatus.toLowerCase()];
         if (byLabel !== undefined) {
            return byLabel as JobLifecycleStatus;
         }

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

   private loadPriceBookAccess(): void {
      this.orgContext.hasMinPlan$('Max').pipe(take(1)).subscribe(hasAccess => {
         this.hasPriceBookAccess = hasAccess;
         if (hasAccess) {
            this.priceBookService.getAllForOrganization().subscribe({
               next: items => this.priceBookItems = items,
               error: () => this.priceBookItems = []
            });
         }
      });
   }
}