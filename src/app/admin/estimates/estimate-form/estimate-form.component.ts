import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { take } from 'rxjs';
import { EstimateService } from '../services/estimate.service';
import { CustomersService } from '../../customer/services/customer.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { Client } from '../../customer/models/customer';
import {
  CreateEstimateRequest,
  Estimate,
  EstimateLineItem,
  EstimateLineItemRequest,
  UpdateEstimateRequest,
} from '../models/estimate';

@Component({
  selector: 'app-estimate-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    TextareaModule
],
  templateUrl: './estimate-form.component.html',
  styleUrl: './estimate-form.component.scss',
})
export class EstimateFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private estimateService = inject(EstimateService);
  private customersService = inject(CustomersService);
  private orgContext = inject(OrganizationContextService);

  @Input() estimate: Estimate | null = null;
  @Output() saved = new EventEmitter<Estimate>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  customers: { id: string; displayName: string }[] = [];
  saving = false;
  error: string | null = null;

  ngOnInit(): void {
    this.buildForm();
    this.orgContext.org$.pipe(take(1)).subscribe(() => this.loadCustomers());
  }

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  get total(): number {
    return this.lineItems.controls.reduce((sum, ctrl) => {
      const qty = Number(ctrl.get('quantity')?.value ?? 0);
      const price = Number(ctrl.get('unitPrice')?.value ?? 0);
      return sum + qty * price;
    }, 0);
  }

  lineTotal(index: number): number {
    const ctrl = this.lineItems.at(index);
    return (Number(ctrl.get('quantity')?.value) || 0) * (Number(ctrl.get('unitPrice')?.value) || 0);
  }

  addLine(): void {
    this.lineItems.push(this.newLineGroup());
  }

  removeLine(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
    }
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.error = null;

    const val = this.form.value;
    const lineItems: EstimateLineItemRequest[] = val.lineItems.map((li: EstimateLineItemRequest) => ({
      name: li.name,
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
    }));

    const obs$ = this.estimate
      ? this.estimateService.update(this.estimate.id, {
          estimateDate: val.estimateDate || undefined,
          expirationDate: val.expirationDate || undefined,
          notes: val.notes || undefined,
          lineItems,
        } as UpdateEstimateRequest)
      : this.estimateService.create({
          organizationClientId: val.organizationClientId,
          estimateDate: val.estimateDate || undefined,
          expirationDate: val.expirationDate || undefined,
          notes: val.notes || undefined,
          lineItems,
        } as CreateEstimateRequest);

    obs$.subscribe({
      next: (result) => {
        this.saving = false;
        this.saved.emit(result);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save estimate. Please try again.';
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  private buildForm(): void {
    const e = this.estimate;
    this.form = this.fb.group({
      organizationClientId: [e?.organizationClientId ?? null, Validators.required],
      estimateDate: [
        e?.estimateDate
          ? e.estimateDate.substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        Validators.required,
      ],
      expirationDate: [e?.expirationDate ? e.expirationDate.substring(0, 10) : ''],
      notes: [e?.notes ?? ''],
      lineItems: this.fb.array(
        e?.lineItems?.length ? e.lineItems.map((li) => this.newLineGroup(li)) : [this.newLineGroup()],
      ),
    });
  }

  private newLineGroup(li?: EstimateLineItem): FormGroup {
    return this.fb.group({
      name: [li?.name ?? li?.description ?? '', Validators.required],
      description: [li?.description ?? '', Validators.required],
      quantity: [li?.quantity ?? 1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [li?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  private loadCustomers(): void {
    this.customersService.getAllByOrganization().subscribe({
      next: (cs: Client[]) => {
        this.customers = cs
          .filter((client) => !!client.id)
          .map((client) => ({
            id: client.id as string,
            displayName: `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || client.emailAddress || 'Unnamed',
          }));
      },
    });
  }
}
