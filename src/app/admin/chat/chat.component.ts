import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ChatService } from './services/chat.service';

interface ChatMessage {
  id?: string;
  content: string;
  timestamp: string;
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  conversationId?: string;
  isMine: boolean;
  [key: string]: any;
}

interface ChatConversation {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [
    NgScrollbarModule,
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbTooltipModule
  ],
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  messageText = '';
  searchQuery = '';
  defaultNavActiveId = 1;
  chatPanelVisible = false;
  readonly currentUserId = 'currentUserId';

  constructor(private chatService: ChatService, private http: HttpClient) { }

  ngOnInit(): void {
    this.chatService.startConnection();
    this.loadConversations();

    this.chatService.onMessageReceived((message) => {
      const normalizedMessage = this.normalizeMessage(message);
      this.updateConversationPreview(normalizedMessage.conversationId, normalizedMessage);

      if (normalizedMessage.conversationId === this.selectedConversation?.id) {
        this.messages = [...this.messages, normalizedMessage];
        if (normalizedMessage.conversationId) {
          this.resetUnreadCount(normalizedMessage.conversationId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }
  }

  loadConversations() {
    this.http.get<any[]>('/api/chat/conversations').subscribe((convos) => {
      const selectedConversationId = this.selectedConversation?.id;
      this.conversations = convos.map((convo) => this.normalizeConversation(convo));

      if (selectedConversationId) {
        this.selectedConversation = this.conversations.find((convo) => convo.id === selectedConversationId) ?? this.selectedConversation;
      }
    });
  }

  selectConversation(convo: ChatConversation): void {
    if (this.selectedConversation?.id === convo.id) {
      this.chatPanelVisible = true;
      this.resetUnreadCount(convo.id);
      return;
    }

    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }

    this.selectedConversation = convo;
    this.chatPanelVisible = true;
    this.resetUnreadCount(convo.id);
    this.chatService.joinConversation(convo.id);

    this.http.get<any[]>(`/api/chat/messages/${convo.id}`).subscribe((msgs) => {
      this.messages = msgs.map((msg) => this.normalizeMessage(msg));
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedConversation) return;

    const msg: ChatMessage = {
      content: this.messageText.trim(),
      timestamp: new Date().toISOString(),
      senderId: this.currentUserId,
      senderName: 'You',
      conversationId: this.selectedConversation.id,
      isMine: true
    };

    this.chatService.sendMessage(this.selectedConversation.id, msg);
    this.messages = [...this.messages, msg];
    this.updateConversationPreview(this.selectedConversation.id, msg, true);
    this.messageText = '';
  }

  startNewChat(): void {
    const recipientId = prompt('Enter recipient user ID');

    if (!recipientId) return;

    this.http.post('/api/chat/conversations', {
      participantIds: [recipientId]
    }).subscribe((newConvo: any) => {
      const normalizedConversation = this.normalizeConversation(newConvo);
      this.conversations = [normalizedConversation, ...this.conversations];
      this.selectConversation(normalizedConversation);
    });
  }

  backToChatList(): void {
    this.chatPanelVisible = false;
  }

  get filteredConversations(): ChatConversation[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.conversations;
    }

    return this.conversations.filter((convo) => {
      const haystack = [
        convo.name,
        convo.role,
        convo.lastMessage?.content
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get contactConversations(): ChatConversation[] {
    return [...this.filteredConversations].sort((left, right) => left.name.localeCompare(right.name));
  }

  get recentCalls(): ChatConversation[] {
    return this.filteredConversations.filter((convo) => convo.lastMessage?.type === 'call');
  }

  getConversationName(convo: ChatConversation | null | undefined): string {
    return convo?.name?.trim() || 'Conversation';
  }

  getConversationRole(convo: ChatConversation | null | undefined): string {
    return convo?.role?.trim() || 'Team member';
  }

  getConversationPreview(convo: ChatConversation): string {
    return convo.lastMessage?.content?.trim() || 'No messages yet';
  }

  getAvatarInitials(name: string | null | undefined): string {
    if (!name?.trim()) {
      return 'JF';
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  trackByConversationId(_index: number, convo: ChatConversation): string {
    return convo.id;
  }

  trackByMessage(_index: number, message: ChatMessage): string {
    return message.id ?? `${message.timestamp}-${message.content}`;
  }

  private normalizeConversation(convo: any): ChatConversation {
    return {
      ...convo,
      id: convo.id,
      name: convo.name ?? convo.title ?? convo.participantName ?? convo.displayName ?? 'Conversation',
      avatarUrl: convo.avatarUrl ?? convo.imageUrl ?? convo.photoUrl ?? null,
      role: convo.role ?? convo.subtitle ?? convo.participantRole ?? 'Team member',
      status: convo.status ?? 'online',
      unreadCount: Number(convo.unreadCount ?? 0),
      lastMessage: convo.lastMessage ? this.normalizeMessage(convo.lastMessage) : null
    };
  }

  private normalizeMessage(message: any): ChatMessage {
    return {
      ...message,
      content: message.content ?? message.text ?? '',
      timestamp: message.timestamp ?? message.createdAt ?? new Date().toISOString(),
      senderId: message.senderId ?? message.sender?.id,
      senderName: message.senderName ?? message.sender?.name,
      senderAvatarUrl: message.senderAvatarUrl ?? message.sender?.avatarUrl ?? null,
      conversationId: message.conversationId,
      isMine: Boolean(message.isMine ?? message.senderId === this.currentUserId)
    };
  }

  private updateConversationPreview(conversationId: string | undefined, message: ChatMessage, sentByCurrentUser = false): void {
    if (!conversationId) {
      return;
    }

    const conversationIndex = this.conversations.findIndex((convo) => convo.id === conversationId);
    if (conversationIndex === -1) {
      return;
    }

    const conversation = this.conversations[conversationIndex];
    const updatedConversation: ChatConversation = {
      ...conversation,
      lastMessage: message,
      unreadCount: sentByCurrentUser || this.selectedConversation?.id === conversationId
        ? 0
        : Number(conversation.unreadCount ?? 0) + 1
    };

    this.conversations = [
      updatedConversation,
      ...this.conversations.filter((convo) => convo.id !== conversationId)
    ];

    if (this.selectedConversation?.id === conversationId) {
      this.selectedConversation = updatedConversation;
    }
  }

  private resetUnreadCount(conversationId: string): void {
    this.conversations = this.conversations.map((convo) => (
      convo.id === conversationId ? { ...convo, unreadCount: 0 } : convo
    ));

    if (this.selectedConversation?.id === conversationId) {
      this.selectedConversation = this.conversations.find((convo) => convo.id === conversationId) ?? this.selectedConversation;
    }
  }

}
