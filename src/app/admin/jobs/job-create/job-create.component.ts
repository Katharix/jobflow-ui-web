import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import {FormsModule} from '@angular/forms';
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {CustomersService} from "../../customer/services/customer.service";
import {JobUpsertRequest, JobsService} from "../services/jobs.service";
import {InvoicingWorkflow, InvoicingWorkflowLabels, Job} from "../models/job";
import {Client} from "../../customer/models/customer";
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {RouterLink} from '@angular/router';

@Component({
   selector: 'app-job-create',
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
export class CreateJobComponent implements AfterViewInit, OnChanges, OnDestroy {
   private jobsService = inject(JobsService);
   private customersService = inject(CustomersService);
   private organizationContext = inject(OrganizationContextService);

   @Output() saved = new EventEmitter<void>();
   @Output() cancelled = new EventEmitter<void>();
   @Input() job: Job | null = null;

   organizationId: string | null = null;

   readonly customers$ = new BehaviorSubject<(Client & { displayName: string })[]>([]);
   selectedCustomerId: string | null = null;
   title = '';
   comments = '';
   invoicingWorkflow: InvoicingWorkflow | null = null;

   invoicingOptions = [
      { label: 'Use org default', value: null },
      { label: InvoicingWorkflowLabels[InvoicingWorkflow.SendInvoice], value: InvoicingWorkflow.SendInvoice },
      { label: InvoicingWorkflowLabels[InvoicingWorkflow.InPerson], value: InvoicingWorkflow.InPerson }
   ];

   saving = false;
   error: string | null = null;
   private orgSub?: Subscription;

   ngAfterViewInit(): void {
      setTimeout(() => {
         this.orgSub = this.organizationContext.org$.subscribe(org => {
            if (!org) return;

            this.organizationId = org.id ?? null;
            this.loadCustomers();
         });
      }, 0);
   }

   ngOnDestroy(): void {
      this.orgSub?.unsubscribe();
   }

   get isEditing(): boolean {
      return !!this.job?.id;
   }

   ngOnChanges(changes: SimpleChanges): void {
      if (!changes['job']) return;

      if (!this.job) {
         this.resetForm();
         return;
      }

      this.selectedCustomerId = this.job.organizationClientId ?? this.job.organizationClient?.id ?? null;
      this.title = this.job.title ?? '';
      this.comments = this.job.comments ?? '';
      this.invoicingWorkflow = this.job.invoicingWorkflow ?? null;
   }

   private loadCustomers(): void {
      if (!this.organizationId) return;

      this.customersService
         .getAllByOrganization()
         .subscribe({
            next: customers => {
               this.customers$.next(customers.map((client) => ({
                  ...client,
                  displayName: `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || client.emailAddress || 'Client'
               })));
            },
            error: () => {
               this.error = 'Failed to load customers.';
               this.customers$.next([]);
            }
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
         id: this.job?.id,
         organizationClientId: this.selectedCustomerId,
         title: this.title.trim(),
         comments: this.comments.trim() || undefined,
         invoicingWorkflow: this.invoicingWorkflow
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

   private resetForm(): void {
      this.selectedCustomerId = null;
      this.title = '';
      this.comments = '';
      this.invoicingWorkflow = null;
      this.error = null;
      this.saving = false;
   }
}
