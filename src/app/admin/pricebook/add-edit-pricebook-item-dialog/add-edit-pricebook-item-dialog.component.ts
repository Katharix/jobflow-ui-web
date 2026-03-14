import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { PriceBookItemType, PriceBookItemDto } from '../services/price-book-item.service';
import { ModalRef } from '../../../common/modal/modal-ref';
import { MODAL_DATA } from '../../../common/modal/modal.tokens';

export interface EditItemData {
  title: string;
  orgId: string;
  item?: PriceBookItemDto; // if present = edit, else create
}

export interface EditItemResult {
  organizationId: string;
  id?: string;
  name: string;
  description?: string | null;
  partNumber?: string | null;
  unit?: string | null;
  cost: number;
  price: number;
  type: PriceBookItemType;
  inventoryUnitsPerSale: number;
  categoryId?: string | null;
}

@Component({
  selector: 'app-add-edit-pricebook-item-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, SelectModule, InputNumberModule, TextareaModule],
  templateUrl: './add-edit-pricebook-item-dialog.component.html',
  styleUrl: './add-edit-pricebook-item-dialog.component.scss'
})
export class AddEditPricebookItemDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject<ModalRef<EditItemResult>>(ModalRef as any);
  data = inject<EditItemData>(MODAL_DATA);

  typeOptions = [
    { label: 'Material', value: 0 },
    { label: 'Service', value: 1 },
    { label: 'Product', value: 2 }
  ];

  form = this.fb.group({
    id:        [this.data.item?.id ?? null],
    organizationId: [this.data.orgId, Validators.required],
    name:      [this.data.item?.name ?? '', [Validators.required, Validators.maxLength(200)]],
    description: [this.data.item?.description ?? '', [Validators.maxLength(2000)]],
    partNumber:  [this.data.item?.partNumber ?? '', [Validators.maxLength(100)]],
    unit:        [this.data.item?.unit ?? '', [Validators.maxLength(50)]],
    cost:        [this.data.item?.cost ?? 0, []],
    price:       [this.data.item?.price ?? 0, []],
    type:        [this.data.item?.itemType ?? 0, []],
    inventoryUnitsPerSale: [this.data.item?.inventoryUnitsPerSale ?? 1, []],
    categoryId:  [this.data.item?.categoryId ?? null],
  });

  close() { this.ref._close(); }
  save()  { if (this.form.valid) this.ref._close(this.form.value as EditItemResult); }
}
