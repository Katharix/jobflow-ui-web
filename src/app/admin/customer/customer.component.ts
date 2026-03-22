import {Component, inject, TemplateRef, ViewChild, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {CustomersService} from "./services/customer.service";
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


@Component({
    selector: 'app-jobflow-create-customer',
    imports: [CommonModule, FormsModule, PageHeaderComponent, ReactiveFormsModule, JobflowGridComponent, JobflowDrawerComponent, CustomerCreateComponent, ModalComponent, DeleteConfirmComponent],
    templateUrl: './customer.component.html',
    styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
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

   private getActionMap() {
      return {
         add: () => this.openAddClient()
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
}
