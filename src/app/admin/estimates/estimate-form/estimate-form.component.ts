import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { take } from 'rxjs';
import { EstimateService } from '../services/estimate.service';
import { CustomersService } from '../../customer/services/customer.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { Client } from '../../customer/models/customer';
import { PriceBookItemDto, PriceBookItemService } from '../../pricebook/services/price-book-item.service';
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
    FormsModule,
    LucideAngularModule,
  ],
  templateUrl: './estimate-form.component.html',
  styleUrl: './estimate-form.component.scss',
})
export class EstimateFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private estimateService = inject(EstimateService);
  private customersService = inject(CustomersService);
  private orgContext = inject(OrganizationContextService);
  private priceBookService = inject(PriceBookItemService);

  @Input() estimate: Estimate | null = null;
  @Output() saved = new EventEmitter<Estimate>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  customers: { id: string; displayName: string }[] = [];
  saving = false;
  error: string | null = null;

  priceBookItems: PriceBookItemDto[] = [];
  filteredPriceBookItems: PriceBookItemDto[] = [];
  hasPriceBookAccess = false;
  priceBookSearch = '';

  ngOnInit(): void {
    this.buildForm();
    this.orgContext.org$.pipe(take(1)).subscribe(() => this.loadCustomers());
    this.loadPriceBookAccess();
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

  searchPriceBookItems(query: string): void {
    const q = (query ?? '').toLowerCase();
    this.filteredPriceBookItems = this.priceBookItems.filter(
      item => item.name.toLowerCase().includes(q)
        || (item.description ?? '').toLowerCase().includes(q)
    );
  }

  onPriceBookInputChange(value: string): void {
    this.searchPriceBookItems(value);
    const match = this.priceBookItems.find(item => item.name === value);
    if (match) {
      this.lineItems.push(this.newLineGroup({
        priceBookItemId: match.id,
        name: match.name,
        description: match.description ?? match.name,
        unitPrice: match.price,
        quantity: 1
      } as EstimateLineItem));
      this.priceBookSearch = '';
      this.filteredPriceBookItems = [];
    }
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.error = null;

    const val = this.form.value;
    const lineItems: EstimateLineItemRequest[] = val.lineItems.map((li: EstimateLineItemRequest & { priceBookItemId?: string }) => ({
      priceBookItemId: li.priceBookItemId || undefined,
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
      priceBookItemId: [li?.priceBookItemId ?? null],
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

  private loadPriceBookAccess(): void {
    this.orgContext.hasMinPlan$('Max').pipe(take(1)).subscribe(hasAccess => {
      this.hasPriceBookAccess = hasAccess;
      if (hasAccess) {
        this.priceBookService.getAllForOrganization().subscribe({
          next: items => this.priceBookItems = items,
          error: () => this.priceBookItems = []
        });
      }
    });
  }
}
