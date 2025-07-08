import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'jobflow-modal',
  templateUrl: './modal.component.html',
  standalone: true,
   imports: [LucideAngularModule, CommonModule]
})
export class ModalComponent {
  @Input() title: string = 'Modal';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() showFooter: boolean = true;
  @Input() size: 'sm' | 'lg' | 'xl' | '' = '';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get modalSizeClass(): string {
    return this.size ? `modal-${this.size}` : '';
  }

  close() {
    this.cancel.emit();
  }

  submit() {
    this.confirm.emit();
  }
}
