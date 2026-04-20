import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QueueCustomer {
  id: string;
  name: string;
  organizationName: string;
  waitMinutes: number;
  position: number;
  avatarInitials: string;
  avatarColor?: string;
}

@Component({
  selector: 'app-queue-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue-card.component.html',
  styleUrl: './queue-card.component.scss',
})
export class QueueCardComponent {
  @Input() customer!: QueueCustomer;
  @Input() compact = false;
  @Output() pickUp = new EventEmitter<string>();

  onPickUp(): void {
    this.pickUp.emit(this.customer.id);
  }
}
