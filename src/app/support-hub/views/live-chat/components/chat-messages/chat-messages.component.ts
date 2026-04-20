import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../components/chat-window/chat-window.component';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-messages.component.html',
  styleUrl: './chat-messages.component.scss',
})
export class ChatMessagesComponent {
  @Input() messages: ChatMessage[] = [];
  @Input() isTyping = false;
  @Input() isLoading = false;
}
