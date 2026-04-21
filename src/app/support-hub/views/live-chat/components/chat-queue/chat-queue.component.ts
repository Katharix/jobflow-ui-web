import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueCustomer } from '../../../../components/queue-card/queue-card.component';
import { QueueCardComponent } from '../../../../components/queue-card/queue-card.component';

@Component({
  selector: 'app-chat-queue',
  standalone: true,
  imports: [CommonModule, QueueCardComponent],
  templateUrl: './chat-queue.component.html',
  styleUrl: './chat-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatQueueComponent {
  @Input() customers: QueueCustomer[] = [];
  @Input() isLoading = false;
  @Output() pickUp = new EventEmitter<string>();
}
