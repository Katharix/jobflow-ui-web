import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {CustomersService} from "./services/customer.service";


@Component({
   selector: 'jobflow-create-customer',
   standalone: true,
   imports: [CommonModule, FormsModule],
   templateUrl: './customer.component.html'
})
export class CustomerComponent {
   organizationId: string | null = null;

   name = '';
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
      if (!this.organizationId || !this.name.trim()) {
         this.error = 'Customer name is required.';
         return;
      }

      this.saving = true;
      this.error = null;

      this.customers.createCustomer(this.organizationId, {
         firstName: this.name,
         emailAddress: this.email || undefined,
         phoneNumber: this.phone || undefined
      }).subscribe({
         next: () => this.router.navigate(['/admin/dashboard']),
         error: () => {
            this.saving = false;
            this.error = 'Failed to create customer.';
         }
      });
   }
}
