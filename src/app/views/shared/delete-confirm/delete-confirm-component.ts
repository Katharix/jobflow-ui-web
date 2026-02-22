import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center p-3">
      <h5 class="fw-semibold">{{ title }}</h5>
      <p class="text-muted">{{ message }}</p>

    </div>
  `
})
export class DeleteConfirmComponent {
  @Input() title: string = 'Confirm Delete';
  @Input() message: string = 'Are you sure you want to delete this item?';
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
