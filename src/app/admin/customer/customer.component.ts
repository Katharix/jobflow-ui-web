import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {CustomersService} from "./services/customer.service";
import {PageHeaderComponent} from "../../views/admin-views/dashboard/page-header/page-header.component";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {JobflowGridColumn, JobflowGridComponent} from "../../common/jobflow-grid/jobflow-grid.component";
import {PriceBookItemDto} from "../pricebook/services/price-book-item.service";
import {ToastService} from "../../common/toast/toast.service";
import {Client} from "./models/customer";
import {CommandClickEventArgs, CommandModel, PageSettingsModel, ToolbarItems} from "@syncfusion/ej2-angular-grids";
import {ClickEventArgs} from "@syncfusion/ej2-navigations";
import {JobflowDrawerComponent} from "../../common/jobflow-drawer/jobflow-drawer.component";
import {CustomerCreateComponent} from "./customer-create/customer-create.component";


@Component({
   selector: 'jobflow-create-customer',
   standalone: true,
   imports: [CommonModule, FormsModule, PageHeaderComponent, ReactiveFormsModule, JobflowGridComponent, JobflowDrawerComponent, CustomerCreateComponent],
   templateUrl: './customer.component.html'
})
export class CustomerComponent {
   organizationId: string | null = null;
   items: Client[] = [];

   error: string | null = null;
   isDrawerOpen = false;
   editingClient: any | null = null;


   private toast = inject(ToastService);

   constructor(
      private customers: CustomersService,
      private orgContext: OrganizationContextService,
      private router: Router
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

   commandButtons: CommandModel[] = [
      {
         type: 'Edit',
         buttonOption: {
            cssClass: 'e-flat e-primary',
            iconCss: 'e-icons e-edit',
            content: 'Edit'
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

   columns: JobflowGridColumn[] = [
      {field: 'firstName', headerText: 'First Name', width: 100},
      {field: 'lastName', headerText: 'Last Name', width: 100},
      {field: 'email', headerText: 'Email Address', width: 100},
      {field: 'phoneNumber', headerText: 'Phone Number', width: 100},
      {headerText: '', width: 140, textAlign: 'Right', commands: this.commandButtons}
   ];

   pageSettings: PageSettingsModel = {pageSize: 20, pageSizes: [10, 20, 50, 100]};

   ngOnInit(): void {
      if (this.organizationId) {
         this.load();
      }
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
            console.log('Items ', this.items)
         },
         error: e => {
            this.toast.error('Failed to load items');
            console.error(e);
         }
      });
   }

   onAddClientClick(): void {

   }

   onCommandClick(args: CommandClickEventArgs) {
      const row = args.rowData as PriceBookItemDto;

      switch (args.commandColumn?.type) {
         case 'Edit':

            break;
         case 'Delete':

            break;
      }
   }

   cancel(): void {
      this.closeDrawer();
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
