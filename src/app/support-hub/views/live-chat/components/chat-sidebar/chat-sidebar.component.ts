import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface ChatSidebarCustomer {
  name: string;
  email: string;
  organizationName: string;
  sessionId: string;
  sessionStartedAt: string;
}

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss',
})
export class ChatSidebarComponent {
  @Input() customer: ChatSidebarCustomer | null = null;
  @Input() isLoading = false;
}
