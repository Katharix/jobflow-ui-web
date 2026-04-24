import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {CustomersService} from "../services/customer.service";
import {ToastService} from "../../../common/toast/toast.service";
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {FormsModule} from "@angular/forms";
import {Client} from "../models/customer";

@Component({
   selector: 'app-customer-create',
   standalone: true,
   imports: [
        FormsModule
   ],
   templateUrl: './customer-create.component.html',
   styleUrl: './customer-create.component.scss'
})
export class CustomerCreateComponent implements OnChanges {
   private customers = inject(CustomersService);
   private orgContext = inject(OrganizationContextService);
   private toast = inject(ToastService);
   private destroyRef = inject(DestroyRef);

   @Input() client: Client | null = null;
   @Output() saved = new EventEmitter<void>();
   @Output() cancelled = new EventEmitter<void>();

   organizationId: string | null = null;
   firstName = '';
   lastName = '';
   email = '';
   phone = '';
   address1 = '';
   address2 = '';
   city = '';
   state = '';
   zipCode = '';

   saving = false;
   error: string | null = null;

   constructor() {
      this.orgContext.org$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(org => {
         this.organizationId = org?.id ?? null;
      });
   }

   ngOnChanges(changes: SimpleChanges): void {
      if (!changes['client']) return;

      if (this.client) {
         this.firstName = this.client.firstName ?? '';
         this.lastName = this.client.lastName ?? '';
         this.email = this.client.emailAddress ?? '';
         this.phone = this.client.phoneNumber ?? '';
         this.address1 = this.client.address1 ?? '';
         this.address2 = this.client.address2 ?? '';
         this.city = this.client.city ?? '';
         this.state = this.client.state ?? '';
         this.zipCode = this.client.zipCode ?? '';
      } else {
         this.resetForm();
      }
   }

   private resetForm(): void {
      this.firstName = '';
      this.lastName = '';
      this.email = '';
      this.phone = '';
      this.address1 = '';
      this.address2 = '';
      this.city = '';
      this.state = '';
      this.zipCode = '';
      this.error = null;
      this.saving = false;
   }

   save(): void {
      if (!this.organizationId || !this.firstName.trim()) {
         this.error = 'Customer name is required.';
         return;
      }
      this.saving = true;
      this.error = null;

      this.customers.createCustomer({
         id: this.client?.id,
         firstName: this.firstName,
         lastName: this.lastName,
         emailAddress: this.email || undefined,
         phoneNumber: this.phone || undefined,
         address1: this.address1 || undefined,
         address2: this.address2 || undefined,
         city: this.city || undefined,
         state: this.state || undefined,
         zipCode: this.zipCode || undefined
      }).subscribe({
         next: () => {
            this.saving = false;
            this.saved.emit();
         },
         error: () => {
            this.saving = false;
            this.error = 'Failed to save customer.';
            this.toast.error('Failed to save client. Please try again.');
         }
      });
   }

   cancel(): void {
      this.cancelled.emit();
   }
}
