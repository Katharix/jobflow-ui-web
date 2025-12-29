import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {CustomersService} from "../../customer/services/customer.service";
import {CreateJobRequest, JobsService} from "../services/jobs.service";

@Component({
   selector: 'jobflow-create-job',
   standalone: true,
   imports: [CommonModule, FormsModule],
   templateUrl: './job-create.component.html'
})
export class CreateJobComponent {
   organizationId: string | null = null;

   customers: any[] = [];
   selectedCustomerId: string | null = null;
   title = '';

   saving = false;
   error: string | null = null;

   constructor(
      private jobsService: JobsService,
      private customersService: CustomersService,
      private organizationContext: OrganizationContextService,
      private router: Router
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
         .getAllByOrganization(this.organizationId)
         .subscribe({
            next: customers => (this.customers = customers),
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

      const payload: CreateJobRequest = {
         organizationClientId: this.selectedCustomerId,
         title: this.title.trim()
      };

      this.jobsService.upsertJob(this.organizationId, payload).subscribe({
         next: () => this.router.navigate(['/admin']),
         error: () => {
            this.saving = false;
            this.error = 'Failed to create job.';
         }
      });
   }
}
