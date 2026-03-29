import {Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {PageHeaderComponent} from "../dashboard/page-header/page-header.component";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {
   JobflowGridColumn,
   JobflowGridCommandClickEventArgs,
   JobflowGridCommandModel,
   JobflowGridComponent,
   JobflowGridPageSettings
} from "../../common/jobflow-grid/jobflow-grid.component";
import {ToastService} from "../../common/toast/toast.service";
import {Client} from "./models/customer";
import {JobflowDrawerComponent} from "../../common/jobflow-drawer/jobflow-drawer.component";
import {ModalComponent} from "../../views/shared/modal/modal.component";
import {DeleteConfirmComponent} from "../../views/shared/delete-confirm/delete-confirm-component";
import {CustomerCreateComponent} from "./customer-create/customer-create.component";
import {formatPhone} from "../../common/utils/app-formaters";
import {
   ClientImportJobStatusResponse,
   ClientImportPreviewResponse,
   CustomersService
} from "./services/customer.service";
import {Subscription, catchError, interval, of, startWith, switchMap} from 'rxjs';


@Component({
   selector: 'app-jobflow-create-customer',
   standalone: true,
   imports: [CommonModule, FormsModule, PageHeaderComponent, ReactiveFormsModule, JobflowGridComponent, JobflowDrawerComponent, CustomerCreateComponent, ModalComponent, DeleteConfirmComponent],
   templateUrl: './customer.component.html',
   styleUrls: ['./customer.component.scss'],
})
export class CustomerComponent implements OnInit, OnDestroy {
   private customers = inject(CustomersService);
   private orgContext = inject(OrganizationContextService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);

   @ViewChild('clientNameTemplate', {static: true})
   clientNameTemplate!: TemplateRef<Client>;

   organizationId: string | null = null;
   items: Client[] = [];
   columns: JobflowGridColumn[] = [];

   error: string | null = null;
   isDrawerOpen = false;
   editingClient: Client | null = null;
   sendingLink = false;
   sendLinkError: string | null = null;
   showDeleteModal = false;
   selectedClient: Client | null = null;
   selectedClientName = '';
   showMissingEmailOnly = false;
   private onboardingActionHandled = false;
   private returnToCommandCenter = false;
   private suppressNextDrawerClosedHandler = false;
   private importPollSub: Subscription | null = null;

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


   private toast = inject(ToastService);

   constructor() {
      this.orgContext.org$.subscribe(org => {
         this.organizationId = org?.id ?? null;
      });
   }

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
            cssClass: 'e-flat e-primary',
            iconCss: 'e-icons e-edit',
            content: 'Edit'
         }
      },
      {
         type: 'SendLink',
         buttonOption: {
            cssClass: 'e-flat e-info',
            iconCss: 'e-icons e-send',
            content: 'Email Client Hub Link'
         }
      },
      {
         type: 'Delete',
         buttonOption: {
            cssClass: 'e-flat e-danger',
            iconCss: 'e-icons e-delete',
            content: 'Delete'
         }
      }
   ];

   pageSettings: JobflowGridPageSettings = {pageSize: 20, pageSizes: [10, 20, 50, 100]};

   ngOnInit(): void {
      this.buildColumns();
      if (this.organizationId) {
         this.load();
      }

      this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-client-drawer') return;

         this.returnToCommandCenter = params.get('returnTo') === 'dashboard-command-center';
         this.openAddClient();
         this.onboardingActionHandled = true;
      });
   }

   ngOnDestroy(): void {
      this.stopImportPolling();
   }

   private getActionMap() {
      return {
         add: () => this.openAddClient(),
         import: () => this.openImportModal()
      };
   }

   load() {
      this.customers.getAllByOrganization().subscribe({
         next: list => {
            this.items = (list ?? []).sort((a, b) => a.firstName.localeCompare(b.lastName));
         },
         error: e => {
            console.error(e);
         }
      });
   }

   get totalClients(): number {
      return this.items.length;
   }

   get clientsWithEmail(): number {
      return this.items.filter(client => !!client.emailAddress?.trim()).length;
   }

   get clientsWithPhone(): number {
      return this.items.filter(client => !!client.phoneNumber?.trim()).length;
   }

   get clientsMissingEmail(): number {
      return this.totalClients - this.clientsWithEmail;
   }

   get filteredItems(): Client[] {
      if (!this.showMissingEmailOnly) {
         return this.items;
      }

      return this.items.filter(client => !client.emailAddress?.trim());
   }

   toggleMissingEmailFilter(): void {
      this.showMissingEmailOnly = !this.showMissingEmailOnly;
   }

   onAddClientClick(): void {
      this.openAddClient();
   }

   onCommandClick(args: JobflowGridCommandClickEventArgs) {
      const client = args.rowData as unknown as Client;

      switch (args.commandColumn?.type) {
         case 'Edit':
            this.editingClient = client;
            this.isDrawerOpen = true;
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
      this.isDrawerOpen = true;
   }

   closeDrawer(): void {
      this.isDrawerOpen = false;
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
}
