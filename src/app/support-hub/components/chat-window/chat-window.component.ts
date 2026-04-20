import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  id: string;
  text: string | null;
  senderName: string;
  sentAt: string;
  perspective: 'outbound' | 'inbound';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  uploading?: boolean;
}

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
})
export class ChatWindowComponent implements OnChanges, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;

  @Input() messages: ChatMessage[] = [];
  @Input() isTyping = false;
  @Input() soundEnabled = true;
  @Input() canUpload = true;
  @Input() perspective: 'customer' | 'rep' = 'customer';
  @Input() isLoading = false;
  @Input() sessionEnded = false;

  @Output() sendMessage = new EventEmitter<string>();
  @Output() fileSelected = new EventEmitter<File>();
  @Output() soundToggled = new EventEmitter<boolean>();

  messageText = '';
  isDragOver = false;
  private shouldScrollToBottom = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.shouldScrollToBottom = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  onSend(): void {
    if (!this.messageText.trim() || this.sessionEnded) return;
    this.sendMessage.emit(this.messageText.trim());
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
    if (input.files?.[0]) this.fileSelected.emit(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.fileSelected.emit(file);
  }
}
