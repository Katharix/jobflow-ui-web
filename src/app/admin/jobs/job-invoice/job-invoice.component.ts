import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {InvoicesService} from "../services/invoices.service";
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {CreateInvoiceLineItemRequest, CreateInvoiceRequest} from "../../../models/invoice";

@Component({
    selector: 'app-jobflow-job-invoice',
    imports: [FormsModule],
    templateUrl: './job-invoice.component.html'
})
export class JobInvoiceComponent {
   private invoicesService = inject(InvoicesService);
   private orgContext = inject(OrganizationContextService);
   private route = inject(ActivatedRoute);
   private router = inject(Router);

   organizationId!: string;
   jobId!: string;
   invoiceId: string | null = null;


   lineItems: CreateInvoiceLineItemRequest[] = [
      { description: '', quantity: 1, unitPrice: 0 }
   ];

   saving = false;
   error: string | null = null;

   constructor() {
      this.jobId = this.route.snapshot.paramMap.get('jobId')!;

      this.orgContext.org$.subscribe(org => {
         if (org) {
            this.organizationId = org.id!;
         }
      });
   }

   addLine(): void {
      this.lineItems.push({
         description: '',
         quantity: 1,
         unitPrice: 0
      });
   }

   save(): void {
      if (!this.organizationId) return;

      this.saving = true;
      this.error = null;

      const payload: CreateInvoiceRequest = {
         jobId: this.jobId,
         lineItems: this.lineItems
      };

      this.invoicesService.createInvoice(this.organizationId, payload)
         .subscribe({
            next: (invoice) => {
               this.invoiceId = invoice.id;
               this.saving = false;
            },
            error: () => {
               this.saving = false;
               this.error = 'Failed to create invoice.';
            }
         });
   }

   send(): void {
      if (!this.invoiceId) return;

      this.saving = true;
      this.error = null;

      this.invoicesService.sendInvoice(this.invoiceId).subscribe({
         next: () => this.router.navigate(['/admin']),
         error: () => {
            this.saving = false;
            this.error = 'Failed to send invoice.';
         }
      });
   }

}
