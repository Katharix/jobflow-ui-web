import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
    selector: 'app-delete-confirm',
    imports: [],
    template: `
    <div class="text-center p-3">
      <h5 class="fw-semibold">{{ title }}</h5>
      <p class="text-muted">{{ message }}</p>

    </div>
  `
})
export class DeleteConfirmComponent {
  @Input() title = 'Confirm Delete';
  @Input() message = 'Are you sure you want to delete this item?';
  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}
