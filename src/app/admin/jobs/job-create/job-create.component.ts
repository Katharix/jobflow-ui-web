import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {CustomersService} from "../../customer/services/customer.service";
import {JobUpsertRequest, JobsService} from "../services/jobs.service";
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {RouterLink} from '@angular/router';

@Component({
   selector: 'job-create',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      InputTextModule,
      SelectModule,
      RouterLink
   ],
   templateUrl: './job-create.component.html'
})
export class CreateJobComponent {
   @Output() saved = new EventEmitter<void>();
   @Output() cancelled = new EventEmitter<void>();

   organizationId: string | null = null;

   customers: any[] = [];
   selectedCustomerId: string | null = null;
   title = '';
   comments = '';

   saving = false;
   error: string | null = null;

   constructor(
      private jobsService: JobsService,
      private customersService: CustomersService,
      private organizationContext: OrganizationContextService
   ) {
      this.organizationContext.org$.subscribe(org => {
         if (!org) return;

         this.organizationId = org.id ?? null;
         this.loadCustomers();
      });
   }

   private loadCustomers(): void {
      if (!this.organizationId) return;

      this.customersService
         .getAllByOrganization()
         .subscribe({
            next: customers => (this.customers = customers.map((c: any) => ({
               ...c,
               displayName: `${c.firstName} ${c.lastName}`
            }))),
            error: () => (this.error = 'Failed to load customers.')
         });
   }

   save(): void {
      if (!this.organizationId || !this.selectedCustomerId || !this.title.trim()) {
         this.error = 'Customer and job title are required.';
         return;
      }

      this.saving = true;
      this.error = null;

      const request: JobUpsertRequest = {
         organizationClientId: this.selectedCustomerId,
         title: this.title.trim(),
         comments: this.comments.trim() || undefined
      };

      this.jobsService.upsertJob(request).subscribe({
         next: () => this.saved.emit(),
         error: () => {
            this.saving = false;
            this.error = 'Failed to create job.';
         }
      });
   }

   cancel(): void {
      this.cancelled.emit();
   }
}
