import {Component, EventEmitter, Output} from '@angular/core';
import {CustomersService} from "../services/customer.service";
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {FormsModule} from "@angular/forms";
import {InputTextModule} from 'primeng/inputtext';

@Component({
   selector: 'customer-create',
   standalone: true,
   imports: [
        FormsModule,
        InputTextModule
   ],
   templateUrl: './customer-create.component.html',
   styleUrl: './customer-create.component.scss'
})
export class CustomerCreateComponent {
   @Output() saved = new EventEmitter<void>();
   @Output() cancelled = new EventEmitter<void>();

   organizationId: string | null = null;
   firstName = '';
   lastName = '';
   email = '';
   phone = '';

   saving = false;
   error: string | null = null;

   constructor(
      private customers: CustomersService,
      private orgContext: OrganizationContextService
   ) {
      this.orgContext.org$.subscribe(org => {
         this.organizationId = org?.id ?? null;
      });
   }

   save(): void {
      if (!this.organizationId || !this.firstName.trim()) {
         this.error = 'Customer name is required.';
         return;
      }
      this.saving = true;
      this.error = null;

      this.customers.createCustomer({
         firstName: this.firstName,
         lastName: this.lastName,
         emailAddress: this.email || undefined,
         phoneNumber: this.phone || undefined
      }).subscribe({
         next: () => this.saved.emit(),
         error: () => {
            this.saving = false;
            this.error = 'Failed to create customer.';
         }
      });
   }

   cancel(): void {
      this.cancelled.emit();
   }
}
