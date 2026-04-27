import {AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {JobflowGridColumn,
   JobflowGridCommandClickEventArgs,
   JobflowGridCommandModel,
   JobflowGridComponent,
   JobflowGridPageSettings,
   JobflowGridSortChangeEvent
} from "../../common/jobflow-grid/jobflow-grid.component";
import {ToastService} from "../../common/toast/toast.service";
import {Client} from "./models/customer";
import {ModalComponent} from "../../views/shared/modal/modal.component";
import {DeleteConfirmComponent} from "../../views/shared/delete-confirm/delete-confirm-component";
import { EmptyStateComponent } from '../../common/empty-state/empty-state.component';
import {CustomerCreateComponent} from "./customer-create/customer-create.component";
import {formatPhone} from "../../common/utils/app-formaters";
import {
   ClientImportJobStatusResponse,
   ClientImportPreviewResponse,
   CustomersService
} from "./services/customer.service";
import {BehaviorSubject, Subscription, Subject, catchError, debounceTime, distinctUntilChanged, EMPTY, interval, of, startWith, switchMap} from 'rxjs';
import { NgbOffcanvas, NgbOffcanvasRef } from '@ng-bootstrap/ng-bootstrap';


@Component({
   selector: 'app-jobflow-create-customer',
   standalone: true,
   imports: [CommonModule, FormsModule, ReactiveFormsModule, JobflowGridComponent, CustomerCreateComponent, ModalComponent, DeleteConfirmComponent, EmptyStateComponent],
   templateUrl: './customer.component.html',
   styleUrls: ['./customer.component.scss'],
})
export class CustomerComponent implements OnInit, AfterViewInit, OnDestroy {
   private customers = inject(CustomersService);
   private orgContext = inject(OrganizationContextService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private cdr = inject(ChangeDetectorRef);
   private offcanvasService = inject(NgbOffcanvas);
   @ViewChild('clientNameTemplate')
   clientNameTemplate!: TemplateRef<Client>;
   @ViewChild('addClientOffcanvas')
   addClientOffcanvasTemplate!: TemplateRef<unknown>;

   organizationId: string | null = null;
   items: Client[] = [];
   clientsLoading = false;
   totalClientCount = 0;
   private withEmailCount: number | null = null;
   private withPhoneCount: number | null = null;
   columns: JobflowGridColumn[] = [];
   searchText = '';
   sortBy = 'createdAt';
   sortDirection: 'asc' | 'desc' = 'desc';
   currentPage = 0;
   private readonly initialMetrics = {
      totalClients: 0,
      clientsWithEmail: 0,
      clientsWithPhone: 0,
      clientsMissingEmail: 0
   };
   metrics$ = new BehaviorSubject(this.initialMetrics);

   error: string | null = null;
   private activeOffcanvasRef: NgbOffcanvasRef | null = null;
   editingClient: Client | null = null;
   sendingLink = false;
   sendLinkError: string | null = null;
   showDeleteModal = false;
   selectedClient: Client | null = null;
   selectedClientName = '';
   showMissingEmailOnly = false;
   private onboardingActionHandled = false;
   private pendingOnboardingAction = false;
   private returnToCommandCenter = false;
   private suppressNextDrawerClosedHandler = false;
   private importPollSub: Subscription | null = null;
   private readonly searchInput$ = new Subject<string>();
   private readonly loadPage$ = new Subject<number>();
   private searchInputSub: Subscription | null = null;
   private loadPageSub: Subscription | null = null;
   private orgSub: Subscription | null = null;
   private routeSub: Subscription | null = null;

   showImportModal = false;
   selectedImportFile: File | null = null;
   selectedImportFileName = '';
   selectedSourceSystem = 'generic';
   importSystems = [
      {value: 'jobber', label: 'Jobber CSV'},
      {value: 'housecall-pro', label: 'Housecall Pro CSV'},
      {value: 'servicetitan', label: 'ServiceTitan CSV'},
      {value: 'generic', label: 'Generic CSV'}
   ];

   importPreview: ClientImportPreviewResponse | null = null;
   importMappings: Record<string, string | null> = {};
   importLoading = false;
   importError: string | null = null;

   importStatus: ClientImportJobStatusResponse | null = null;
   importJobId: string | null = null;

   // Bulk-add state
   showBulkAddModal = false;
   bulkRows: { firstName: string; lastName: string; email: string; phone: string; address1: string; city: string; state: string; zipCode: string }[] = [];
   bulkSaving = false;
   bulkError: string | null = null;

   private toast = inject(ToastService);

   // --- Header Actions ---
   headerActions = [
      {
         key: 'add',
         label: 'Add Client',
         icon: 'plus-circle',
         class: 'btn btn-primary px-4 fw-semibold'
      },
      {
         key: 'import',
         label: 'Import Data',
         icon: 'upload',
         class: 'btn btn-outline-primary px-4 fw-semibold'
      }
   ].map(action => ({
      ...action,
      click: getClickHandler(action.key, this.getActionMap())
   }));

   commandButtons: JobflowGridCommandModel[] = [
      {
         type: 'Edit',
         buttonOption: {
            cssClass: 'jf-action jf-action--primary',
            iconCss: 'pi pi-pencil',
            content: 'Edit'
         }
      },
      {
         type: 'SendLink',
         buttonOption: {
            cssClass: 'jf-action jf-action--secondary',
            iconCss: 'pi pi-send',
            content: 'Email Link'
         }
      },
      {
         type: 'Delete',
         buttonOption: {
            cssClass: 'jf-action jf-action--danger',
            iconCss: 'pi pi-trash',
            content: 'Delete'
         }
      }
   ];

   pageSettings: JobflowGridPageSettings = {pageSize: 50, pageSizes: [20, 50, 100]};

   ngOnInit(): void {
      this.loadPageSub = this.loadPage$
         .pipe(
            switchMap((page) => {
               this.clientsLoading = true;
               const offset = page * (this.pageSettings.pageSize ?? 50);
               return this.customers.getAllByOrganizationPaged({
                  cursor: offset > 0 ? btoa(`off|${offset}`) : undefined,
                  pageSize: this.pageSettings.pageSize ?? 50,
                  missingEmailOnly: this.showMissingEmailOnly,
                  search: this.searchText,
                  sortBy: this.sortBy,
                  sortDirection: this.sortDirection
               }).pipe(
                  catchError(() => {
                     this.clientsLoading = false;
                     return EMPTY;
                  })
               );
            })
         )
         .subscribe(page => {
            this.clientsLoading = false;
            if (!page) {
               return;
            }

            this.items = page.items ?? [];
            this.totalClientCount = page.totalCount ?? 0;
            this.withEmailCount = page.withEmailCount ?? null;
            this.withPhoneCount = page.withPhoneCount ?? null;
            this.refreshMetrics();
         });

      this.searchInputSub = this.searchInput$
         .pipe(debounceTime(300), distinctUntilChanged())
         .subscribe(search => {
            this.searchText = search;
            this.load();
         });

      this.orgSub = this.orgContext.org$.subscribe(org => {
         const nextOrganizationId = org?.id ?? null;
         const hasOrganizationChanged = nextOrganizationId !== this.organizationId;
         this.organizationId = nextOrganizationId;

         if (hasOrganizationChanged && this.organizationId) {
            this.load();
         }
      });

      this.routeSub = this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-client-drawer') return;

         this.returnToCommandCenter = params.get('returnTo') === 'dashboard-command-center';
         this.pendingOnboardingAction = true;
         this.onboardingActionHandled = true;
      });
   }

   ngAfterViewInit(): void {
      this.buildColumns();
      if (this.pendingOnboardingAction) {
         this.pendingOnboardingAction = false;
         this.openAddClient();
      }
      this.cdr.detectChanges();
   }

   ngOnDestroy(): void {
      this.stopImportPolling();
      this.searchInputSub?.unsubscribe();
      this.loadPageSub?.unsubscribe();
      this.orgSub?.unsubscribe();
      this.routeSub?.unsubscribe();
   }

   private getActionMap() {
      return {
         add: () => this.openAddClient(),
         import: () => this.openImportModal(),
         bulkAdd: () => this.openBulkAddModal()
      };
   }

   load() {
      this.metrics$.next(this.initialMetrics);
      this.currentPage = 0;
      this.loadClientPage();
   }

   private loadClientPage(): void {
      this.loadPage$.next(this.currentPage);
   }

   onPageChange(event: { page: number; pageSize: number }): void {
      if (event.pageSize !== this.pageSettings.pageSize) {
         this.pageSettings = { ...this.pageSettings, pageSize: event.pageSize };
         this.currentPage = 0;
      } else {
         this.currentPage = event.page;
      }
      this.loadClientPage();
   }

   get filteredItems(): Client[] {
      return this.items;
   }

   toggleMissingEmailFilter(): void {
      this.showMissingEmailOnly = !this.showMissingEmailOnly;
      this.load();
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

   onAddClientClick(): void {
      this.openAddClient();
   }

   onCommandClick(args: JobflowGridCommandClickEventArgs) {
      const client = args.rowData as unknown as Client;

      switch (args.commandColumn?.type) {
         case 'Edit':
            this.editingClient = client;
            this.openClientDrawer();
            break;
         case 'SendLink':
            this.sendClientHubLink(client);
            break;
         case 'Delete':
            this.deleteClient(client);
            break;
      }
   }

   sendClientHubLink(client: Client): void {
      if (this.sendingLink) return;
      if (!client.id) return;
      if (!client.emailAddress?.trim()) {
         this.toast.error('Client email address is required to send the link.');
         return;
      }

      this.sendingLink = true;
      this.sendLinkError = null;

      this.customers.sendClientHubLink(client.id, {
         recipientEmail: client.emailAddress.trim()
      }).subscribe({
         next: () => {
            this.sendingLink = false;
            this.toast.success('Client Hub link sent successfully.');
         },
         error: () => {
            this.sendingLink = false;
            this.sendLinkError = 'Failed to send link. Please try again.';
            this.toast.error(this.sendLinkError);
         }
      });
   }

   deleteClient(client: Client): void {
      this.selectedClient = client;
      this.selectedClientName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
      this.showDeleteModal = true;
   }

   closeDeleteModal(): void {
      this.showDeleteModal = false;
      this.selectedClient = null;
      this.selectedClientName = '';
   }

   confirmDelete(): void {
      if (!this.selectedClient?.id) {
         this.toast.show('Unable to delete client without an ID.', undefined, 'warning');
         return;
      }

      this.customers.deleteClient(this.selectedClient.id).subscribe({
         next: () => {
            this.toast.success('Client deleted successfully.');
            this.load();
            this.closeDeleteModal();
         },
         error: () => {
            this.toast.show('Failed to delete client. Please try again.', undefined, 'error');
         }
      });
   }

   buildColumns(): void {
      this.columns = [
         {
            headerText: 'Client Name',
            width: 100,
            sortField: 'firstName',
            searchFields: ['firstName', 'lastName'],
            template: this.clientNameTemplate
         },
         {
            field: 'emailAddress',
            headerText: 'Email Address',
            width: 100
         },
         {
            field: 'phoneNumber',
            headerText: 'Phone Number',
            width: 100,
            valueAccessor: (_field: string, data: unknown) => {
               const client = data as Client;
               return formatPhone(client?.phoneNumber);
            }
         },
         {headerText: '', width: 140, textAlign: 'Right', commands: this.commandButtons}
      ];

   }

   cancel(): void {
      this.closeDrawer();
   }

   onCreateSaved(): void {
      if (this.returnToCommandCenter) {
         this.suppressNextDrawerClosedHandler = true;
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
         return;
      }

      this.load();
      this.closeDrawer();
      this.toast.success('Client saved successfully.');
   }

   onCreateCancelled(): void {
      if (this.returnToCommandCenter) {
         this.suppressNextDrawerClosedHandler = true;
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
         return;
      }

      this.closeDrawer();
   }

   onDrawerClosed(): void {
      if (this.suppressNextDrawerClosedHandler) {
         this.suppressNextDrawerClosedHandler = false;
         return;
      }

      this.closeDrawer();

      if (this.returnToCommandCenter) {
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
      }
   }

   openAddClient(): void {
      this.editingClient = null;
      this.openClientDrawer();
   }

   private openClientDrawer(): void {
      if (this.activeOffcanvasRef) { return; }
      this.activeOffcanvasRef = this.offcanvasService.open(this.addClientOffcanvasTemplate, {
         position: 'end',
         panelClass: 'jf-drawer-panel',
         backdrop: true,
         keyboard: true
      });
      this.activeOffcanvasRef.result.then(
         () => { this.activeOffcanvasRef = null; this.onDrawerClosed(); },
         () => { this.activeOffcanvasRef = null; this.onDrawerClosed(); }
      );
   }

   closeDrawer(): void {
      this.activeOffcanvasRef?.close();
      this.activeOffcanvasRef = null;
      this.editingClient = null;
   }

   openImportModal(): void {
      this.showImportModal = true;
      this.selectedImportFile = null;
      this.selectedImportFileName = '';
      this.importPreview = null;
      this.importMappings = {};
      this.importError = null;
      this.importLoading = false;
      this.importStatus = null;
      this.importJobId = null;
      this.stopImportPolling();
   }

   closeImportModal(): void {
      this.showImportModal = false;
      this.stopImportPolling();
   }

   onImportFileSelected(event: Event): void {
      const file = (event.target as HTMLInputElement).files?.[0] ?? null;
      this.selectedImportFile = file;
      this.selectedImportFileName = file?.name ?? '';
      this.importPreview = null;
      this.importMappings = {};
      this.importStatus = null;
      this.importJobId = null;
      this.importError = null;
   }

   loadImportPreview(): void {
      if (!this.selectedImportFile) {
         this.importError = 'Choose a CSV file first.';
         return;
      }

      this.importLoading = true;
      this.importError = null;
      this.importPreview = null;

      this.customers.previewClientImport(this.selectedImportFile, this.selectedSourceSystem).subscribe({
         next: response => {
            this.importPreview = response;
            this.importMappings = {...response.suggestedMappings};
            this.importLoading = false;
         },
         error: err => {
            this.importLoading = false;
            this.importError = err?.error ?? 'Failed to preview CSV import. Check your file and try again.';
         }
      });
   }

   startImport(): void {
      if (!this.importPreview?.uploadToken) {
         this.importError = 'Preview your CSV before starting import.';
         return;
      }

      if (!this.hasMappedColumns) {
         this.importError = 'Map at least one column before importing.';
         return;
      }

      this.importLoading = true;
      this.importError = null;

      this.customers.startClientImport({
         uploadToken: this.importPreview.uploadToken,
         sourceSystem: this.selectedSourceSystem,
         columnMappings: this.importMappings
      }).subscribe({
         next: response => {
            this.importLoading = false;
            this.importJobId = response.jobId;
            this.beginImportPolling(response.jobId);
         },
         error: err => {
            this.importLoading = false;
            this.importError = err?.error ?? 'Could not start import.';
         }
      });
   }

   onMappingChange(column: string, value: string): void {
      this.importMappings[column] = value;
   }

   get hasMappedColumns(): boolean {
      return Object.values(this.importMappings).some(value => !!value && value !== 'Ignore');
   }

   get importProgressPercent(): number {
      if (!this.importStatus || this.importStatus.totalRows <= 0) {
         return 0;
      }

      return Math.min(100, Math.round((this.importStatus.processedRows / this.importStatus.totalRows) * 100));
   }

   private refreshMetrics(): void {
      const totalClients = this.totalClientCount;
      const clientsWithEmail = this.withEmailCount ?? this.items.filter(client => !!client.emailAddress?.trim()).length;
      const clientsWithPhone = this.withPhoneCount ?? this.items.filter(client => !!client.phoneNumber?.trim()).length;

      this.metrics$.next({
         totalClients,
         clientsWithEmail,
         clientsWithPhone,
         clientsMissingEmail: Math.max(0, totalClients - clientsWithEmail)
      });
   }

   private beginImportPolling(jobId: string): void {
      this.stopImportPolling();

      this.importPollSub = interval(1500)
         .pipe(
            startWith(0),
            switchMap(() => this.customers.getClientImportStatus(jobId).pipe(
               catchError(() => of(null))
            ))
         )
         .subscribe(status => {
            if (!status) {
               return;
            }

            this.importStatus = status;

            if (status.status === 'completed') {
               this.stopImportPolling();
               this.importJobId = null;
               this.load();
               this.toast.success(`Import completed. ${status.succeededRows} clients imported.`);
            }

            if (status.status === 'failed') {
               this.stopImportPolling();
               this.importJobId = null;
               this.importError = status.errorMessage ?? 'Import failed.';
               this.toast.error(this.importError);
            }
         });
   }

   private stopImportPolling(): void {
      this.importPollSub?.unsubscribe();
      this.importPollSub = null;
   }

   downloadClientsCsv(): void {
      this.customers.downloadClientsCsv().subscribe({
         next: blob => {
            this.downloadBlob(blob, this.fileNameWithTimestamp('jobflow-clients-export', 'csv'));
            this.toast.success('Client CSV downloaded.');
         },
         error: () => {
            this.toast.error('Could not download client CSV. Please try again.');
         }
      });
   }

   private downloadBlob(blob: Blob, fileName: string): void {
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
   }

   private fileNameWithTimestamp(prefix: string, extension: string): string {
      const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      return `${prefix}-${stamp}.${extension}`;
   }

   // --- Bulk-add methods ---

   openBulkAddModal(): void {
      this.showBulkAddModal = true;
      this.bulkError = null;
      this.bulkSaving = false;
      this.bulkRows = [this.emptyBulkRow(), this.emptyBulkRow(), this.emptyBulkRow()];
   }

   closeBulkAddModal(): void {
      this.showBulkAddModal = false;
   }

   addBulkRow(): void {
      this.bulkRows = [...this.bulkRows, this.emptyBulkRow()];
   }

   removeBulkRow(index: number): void {
      this.bulkRows = this.bulkRows.filter((_, i) => i !== index);
   }

   submitBulkAdd(): void {
      const valid = this.bulkRows.filter(r => r.firstName.trim());
      if (valid.length === 0) {
         this.bulkError = 'At least one row with a first name is required.';
         return;
      }

      this.bulkSaving = true;
      this.bulkError = null;

      const payloads = valid.map(r => ({
         firstName: r.firstName.trim(),
         lastName: r.lastName.trim(),
         emailAddress: r.email.trim() || undefined,
         phoneNumber: r.phone.trim() || undefined,
         address1: r.address1.trim() || undefined,
         city: r.city.trim() || undefined,
         state: r.state.trim() || undefined,
         zipCode: r.zipCode.trim() || undefined
      }));

      this.customers.bulkCreateCustomers(payloads).subscribe({
         next: () => {
            this.bulkSaving = false;
            this.showBulkAddModal = false;
            this.load();
            this.toast.success(`${valid.length} client(s) added successfully.`);
         },
         error: () => {
            this.bulkSaving = false;
            this.bulkError = 'Failed to add clients. Please check your entries and try again.';
         }
      });
   }

   private emptyBulkRow() {
      return { firstName: '', lastName: '', email: '', phone: '', address1: '', city: '', state: '', zipCode: '' };
   }
}
