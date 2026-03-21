
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import {
  ClientHubChatConversation,
  ClientHubChatMessage,
  ClientHubChatService,
} from '../../services/client-hub-chat.service';
import {
  ClientHubChatReadReceiptPayload,
  ClientHubChatRealtimeService,
  ClientHubChatTypingPayload,
} from '../../services/client-hub-chat-realtime.service';

type ClientHubChatMessageWithDates = ClientHubChatMessage & {
  timestamp?: string;
  createdAt?: string;
};

@Component({
  selector: 'app-client-hub-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-hub-chat.component.html',
  styleUrl: './client-hub-chat.component.scss',
})
export class ClientHubChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatBody') chatBody?: ElementRef<HTMLDivElement>;
  private readonly chatService = inject(ClientHubChatService);
  private readonly realtimeService = inject(ClientHubChatRealtimeService);
  private readonly authService = inject(ClientHubAuthService);
  private readonly router = inject(Router);

  isLoading = true;
  isLoadingMessages = false;
  error: string | null = null;

  conversation: ClientHubChatConversation | null = null;
  messages: ClientHubChatMessage[] = [];
  messageText = '';
  isRemoteTyping = false;
  private typingTimeoutId: number | null = null;
  private typingIndicatorTimeoutId: number | null = null;

  private readonly pageSize = 50;
  private page = 1;
  hasMore = false;

  ngOnInit(): void {
    this.realtimeService.onMessageReceived((message) => this.onRealtimeMessage(message));
    this.realtimeService.onReadReceipt((payload) => this.onReadReceipt(payload));
    this.realtimeService.onTyping((payload) => this.onTyping(payload));
    this.loadConversation();
  }

  ngOnDestroy(): void {
    if (this.conversation) {
      void this.realtimeService.leaveConversation(this.conversation.id);
    }

    void this.realtimeService.stopConnection();
  }

  get conversationName(): string {
    return this.conversation?.name ?? 'Your Team';
  }

  get isReady(): boolean {
    return !this.isLoading && !this.error;
  }

  sendMessage(): void {
    if (!this.conversation) return;

    const trimmed = this.messageText.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}`;
    const pendingMessage: ClientHubChatMessage = {
      id: tempId,
      conversationId: this.conversation.id,
      content: trimmed,
      sentAt: new Date().toISOString(),
      senderName: 'You',
      isMine: true,
      isRead: false,
      deliveryStatus: 'sending',
    };

    this.messages = [...this.messages, pendingMessage];
    this.messageText = '';
    this.scrollToBottom();

    this.chatService.sendMessage(this.conversation.id, trimmed).subscribe({
      next: (message) => {
        const normalized = this.normalizeMessage(message);
        normalized.deliveryStatus = 'sent';
        this.messages = this.messages.map((existing) =>
          existing.id === tempId ? normalized : existing
        );
        this.scrollToBottom();
      },
      error: (error: HttpErrorResponse) => {
        this.messages = this.messages.map((existing) =>
          existing.id === tempId ? { ...existing, deliveryStatus: 'failed' } : existing
        );
        this.handleError(error);
      },
    });
  }

  loadMoreMessages(): void {
    if (!this.conversation || this.isLoadingMessages || !this.hasMore) return;
    this.page += 1;
    this.loadMessages(false);
  }

  refreshMessages(): void {
    if (!this.conversation) return;
    this.page = 1;
    this.loadMessages(true);
  }

  notifyTyping(): void {
    if (!this.conversation) return;

    if (this.typingTimeoutId) {
      window.clearTimeout(this.typingTimeoutId);
    }

    void this.realtimeService.sendTyping(this.conversation.id, true);
    this.typingTimeoutId = window.setTimeout(() => {
      if (this.conversation) {
        void this.realtimeService.sendTyping(this.conversation.id, false);
      }
    }, 1800);
  }

  trackByMessageId(_index: number, message: ClientHubChatMessage): string {
    return message.id;
  }

  getAvatarInitials(name?: string | null): string {
    const trimmed = name?.trim();
    if (!trimmed) return 'JF';

    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private loadConversation(): void {
    this.isLoading = true;
    this.error = null;

    this.chatService.getConversation().subscribe({
      next: async (conversation) => {
        this.conversation = conversation;
        await this.realtimeService.startConnection();
        await this.realtimeService.joinConversation(conversation.id);
        this.page = 1;
        this.loadMessages(true);
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private loadMessages(reset: boolean): void {
    if (!this.conversation) return;
    this.isLoadingMessages = true;

    this.chatService.getMessages(this.conversation.id, this.page, this.pageSize).subscribe({
      next: (messages) => {
        const normalized = messages.map((message) => this.normalizeMessage(message));
        this.messages = reset ? normalized : [...normalized, ...this.messages];
        this.hasMore = normalized.length === this.pageSize;
        this.isLoadingMessages = false;
        this.isLoading = false;

        if (normalized.some((message) => !message.isMine && !message.isRead)) {
          void this.chatService.markRead(this.conversation!.id).subscribe();
        }

        if (reset) {
          this.scrollToBottom();
        }
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private normalizeMessage(message: ClientHubChatMessage): ClientHubChatMessage {
    const source: ClientHubChatMessageWithDates = message;
    const sentAt = source.sentAt ?? source.timestamp ?? source.createdAt ?? new Date().toISOString();
    return {
      ...message,
      content: message.content ?? '',
      sentAt,
      isMine: Boolean(message.isMine),
      isRead: Boolean(message.isRead),
      deliveryStatus: message.isMine ? (message.deliveryStatus ?? 'sent') : null,
    };
  }

  private onRealtimeMessage(message: ClientHubChatMessage): void {
    if (!this.conversation || !message?.conversationId) return;
    if (message.conversationId !== this.conversation.id) return;
    if (this.messages.some((existing) => existing.id === message.id)) return;

    const normalized = this.normalizeMessage(message);

    if (normalized.isMine) {
      const pendingIndex = this.messages.findIndex((existing) =>
        existing.isMine
        && existing.deliveryStatus === 'sending'
        && existing.content === normalized.content
      );

      if (pendingIndex >= 0) {
        const updated = [...this.messages];
        updated[pendingIndex] = normalized;
        this.messages = updated;
        this.scrollToBottom();
        return;
      }
    }

    this.messages = [...this.messages, normalized];

    this.scrollToBottom();

    if (!message.isMine) {
      void this.chatService.markRead(this.conversation.id).subscribe();
    }
  }

  private onReadReceipt(payload: ClientHubChatReadReceiptPayload): void {
    if (!payload?.conversationId || payload.conversationId !== this.conversation?.id) return;
    if (!Array.isArray(payload.messageIds)) return;

    const readIds = new Set(payload.messageIds);
    this.messages = this.messages.map((message) =>
      readIds.has(message.id) ? { ...message, isRead: true } : message
    );
  }

  private onTyping(payload: ClientHubChatTypingPayload): void {
    if (!payload?.conversationId || payload.conversationId !== this.conversation?.id) return;
    if (payload.senderType !== 'org') return;

    this.isRemoteTyping = Boolean(payload.isTyping);
    if (this.typingIndicatorTimeoutId) {
      window.clearTimeout(this.typingIndicatorTimeoutId);
    }

    if (this.isRemoteTyping) {
      this.typingIndicatorTimeoutId = window.setTimeout(() => {
        this.isRemoteTyping = false;
      }, 2500);
    }
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      this.authService.handleUnauthorized(this.router, '/client-hub/chat');
      return;
    }

    this.error = 'Unable to load chat right now. Please try again.';
    this.isLoading = false;
    this.isLoadingMessages = false;
  }

  private scrollToBottom(): void {
    if (!this.chatBody?.nativeElement) return;
    setTimeout(() => {
      const element = this.chatBody?.nativeElement;
      if (!element) return;
      element.scrollTop = element.scrollHeight;
    }, 0);
  }
}
