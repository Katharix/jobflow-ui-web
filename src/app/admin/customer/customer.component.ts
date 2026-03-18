import {Component, inject, TemplateRef, ViewChild} from '@angular/core';
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
import {PriceBookItemDto} from "../pricebook/services/price-book-item.service";
import {ToastService} from "../../common/toast/toast.service";
import {Client} from "./models/customer";
import {JobflowDrawerComponent} from "../../common/jobflow-drawer/jobflow-drawer.component";
import {CustomerCreateComponent} from "./customer-create/customer-create.component";
import {formatPhone} from "../../common/utils/app-formaters";


@Component({
   selector: 'jobflow-create-customer',
   standalone: true,
   imports: [CommonModule, FormsModule, PageHeaderComponent, ReactiveFormsModule, JobflowGridComponent, JobflowDrawerComponent, CustomerCreateComponent],
   templateUrl: './customer.component.html',
   styleUrls: ['./customer.component.scss'],
})
export class CustomerComponent {
   @ViewChild('clientNameTemplate', {static: true})
   clientNameTemplate!: TemplateRef<any>;

   organizationId: string | null = null;
   items: Client[] = [];
   columns: JobflowGridColumn[] = [];

   error: string | null = null;
   isDrawerOpen = false;
   editingClient: any | null = null;
   isSendLinkDrawerOpen = false;
   clientToSendLink: Client | null = null;
   sendLinkEmail = '';
   sendLinkMessage = '';
   sendingLink = false;
   sendLinkError: string | null = null;
   private onboardingActionHandled = false;
   private returnToCommandCenter = false;
   private suppressNextDrawerClosedHandler = false;


   private toast = inject(ToastService);

   constructor(
      private customers: CustomersService,
      private orgContext: OrganizationContextService,
      private router: Router,
      private route: ActivatedRoute
   ) {
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
            content: 'Send Link'
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

   onAddClientClick(): void {

   }

   onCommandClick(args: JobflowGridCommandClickEventArgs) {
      const client = args.rowData as Client;

      switch (args.commandColumn?.type) {
         case 'Edit':
            this.editingClient = client;
            this.isDrawerOpen = true;
            break;
         case 'SendLink':
            this.openSendLink(client);
            break;
         case 'Delete':
            this.deleteClient(client);
            break;
      }
   }

   openSendLink(client: Client): void {
      this.clientToSendLink = client;
      this.sendLinkEmail = client.email ?? '';
      this.sendLinkMessage = '';
      this.sendLinkError = null;
      this.isSendLinkDrawerOpen = true;
   }

   confirmSendLink(): void {
      if (!this.clientToSendLink || !this.sendLinkEmail.trim()) return;
      if (!this.clientToSendLink.id) return;
      this.sendingLink = true;
      this.sendLinkError = null;

      this.customers.sendClientHubLink(this.clientToSendLink.id, {
         recipientEmail: this.sendLinkEmail.trim(),
         message: this.sendLinkMessage.trim() || undefined
      }).subscribe({
         next: () => {
            this.sendingLink = false;
            this.isSendLinkDrawerOpen = false;
            this.toast.success('Client Hub link sent successfully.');
         },
         error: () => {
            this.sendingLink = false;
            this.sendLinkError = 'Failed to send link. Please try again.';
         }
      });
   }

   closeSendLinkDrawer(): void {
      this.isSendLinkDrawerOpen = false;
      this.clientToSendLink = null;
   }

   deleteClient(client: Client): void {
      if (!confirm(`Delete ${client.firstName} ${client.lastName}? This cannot be undone.`)) return;
      // TODO: Add delete endpoint if needed
      this.toast.show('Delete functionality coming soon.', undefined, 'info');
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
            valueAccessor: (_field: string, data: any) =>
               formatPhone(data?.phoneNumber)
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
