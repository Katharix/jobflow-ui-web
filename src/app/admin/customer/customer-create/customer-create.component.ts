import {Component} from '@angular/core';
import {CustomersService} from "../services/customer.service";
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";

@Component({
   selector: 'customer-create',
   standalone: true,
   imports: [
      FormsModule
   ],
   templateUrl: './customer-create.component.html',
   styleUrl: './customer-create.component.scss'
})
export class CustomerCreateComponent {
   organizationId: string | null = null;
   firstName = '';
   lastName = '';
   email = '';
   phone = '';

   saving = false;
   error: string | null = null;

   constructor(
      private customers: CustomersService,
      private orgContext: OrganizationContextService,
      private router: Router
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
         next: () => this.router.navigate(['/admin']),
         error: () => {
            this.saving = false;
            this.error = 'Failed to create customer.';
         }
      });
   }

   cancel(): void {

   }
}
