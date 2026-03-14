import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ModalRef } from '../../../common/modal/modal-ref';
import { MODAL_DATA } from '../../../common/modal/modal.tokens';


export interface AddEditCategoryData {
  title: string;
  name?: string;
  description?: string | null;
}

export interface AddEditCategoryResult {
  name: string;
  description?: string | null;
}

@Component({
  selector: 'app-add-edit-pricebook-category-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, TextareaModule],
  templateUrl: './add-edit-pricebook-category-dialog.component.html',
  styleUrl: './add-edit-pricebook-category-dialog.component.scss'
})
export class AddEditPriceBookCategoryDialogComponent {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    private ref: ModalRef<AddEditCategoryResult>,
    @Inject(MODAL_DATA) public data: AddEditCategoryData
  ) {
    this.form = this.fb.group({
      name: [this.data.name ?? '', [Validators.required, Validators.maxLength(200)]],
      description: [this.data.description ?? '', [Validators.maxLength(1000)]],
    });
  }

  close() { this.ref._close(); }
  save() { if (this.form.valid) this.ref._close(this.form.value as AddEditCategoryResult); }
}
