import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {FormGroup} from "@angular/forms";

@Component({
  selector: 'app-jobflow-modal',
  templateUrl: './modal.component.html',
  standalone: true,
   imports: [LucideAngularModule, CommonModule]
})
export class ModalComponent {
  @Input() formGroup?: FormGroup; // optional form for validation
  @Input() title = 'Modal';
  @Input() cancelButtonClass = 'btn btn-secondary';
  @Input() confirmButtonClass = 'btn btn-primary';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() showFooter = true;
  @Input() size: 'sm' | 'lg' | 'xl' | '' = '';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get modalSizeClass(): string {
    return this.size ? `modal-${this.size}` : '';
  }

  close() {
    this.cancelled.emit();
  }

  submit() {
    if (this.formGroup) {
      this.formGroup.markAllAsTouched();

      if (this.formGroup.invalid) {
        return;
      }
    }

    this.confirmed.emit();
  }
}
