import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
})
export class ChatInputComponent {
  @Input() disabled = false;
  @Input() canUpload = true;
  @Output() messageSent = new EventEmitter<string>();
  @Output() fileAttached = new EventEmitter<File>();

  messageText = '';

  onSend(): void {
    if (!this.messageText.trim() || this.disabled) return;
    this.messageSent.emit(this.messageText.trim());
    this.messageText = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.fileAttached.emit(input.files[0]);
  }
}
