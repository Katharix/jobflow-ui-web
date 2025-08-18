import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MODAL_DATA } from './modal.tokens';
import { ModalRef } from './modal-ref';
import { ModalContainerComponent } from './modal-container.component';

export interface ConfirmData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ data.title || 'Confirm' }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="onCancel()"></button>
    </div>
    <div class="modal-body">
      <p class="mb-0">{{ data.message || 'Are you sure?' }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
      <button type="button" class="btn btn-primary" (click)="onConfirm()">{{ data.confirmText || 'Confirm' }}</button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    private readonly ref: ModalRef<boolean>,
    @Inject(MODAL_DATA) public readonly data: ConfirmData
  ) {}

  onCancel() { this.ref._close(false); }
  onConfirm() { this.ref._close(true); }
}