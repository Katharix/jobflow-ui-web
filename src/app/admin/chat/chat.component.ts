import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ChatService } from './services/chat.service';
import { FileUploadService } from '../branding/services/file-upload.service';

interface ChatMessage {
  id?: string;
  content: string;
  timestamp: string;
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  attachmentUrl?: string | null;
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
  private auth = inject(Auth);
  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  messageText = '';
  searchQuery = '';
  defaultNavActiveId = 1;
  chatPanelVisible = false;
  currentUserId = '';
  readonly pageSize = 50;
  private messagesPage = 1;
  hasMoreMessages = false;
  isLoadingMessages = false;
  isSending = false;
  attachmentFile: File | null = null;
  attachmentPreviewUrl: string | null = null;
  attachmentUploadError: string | null = null;
  private readonly uploadPreset = 'company_logos_unsigned';
  private readonly uploadFolder = 'jobflow/chat';

  constructor(private chatService: ChatService, private http: HttpClient, private uploadService: FileUploadService) { }

  ngOnInit(): void {
    this.currentUserId = this.auth.currentUser?.uid ?? '';
    this.chatService.startConnection();
    this.loadConversations();

    this.chatService.onMessageReceived((message) => {
      const normalizedMessage = this.normalizeMessage(message);
      this.updateConversationPreview(normalizedMessage.conversationId, normalizedMessage);

      if (normalizedMessage.conversationId === this.selectedConversation?.id) {
        this.messages = [...this.messages, normalizedMessage];
        if (normalizedMessage.conversationId) {
          this.resetUnreadCount(normalizedMessage.conversationId);
          this.markConversationRead(normalizedMessage.conversationId);
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
    this.messagesPage = 1;
    this.hasMoreMessages = true;
    this.messages = [];
    this.loadMessages(true);
    this.markConversationRead(convo.id);
  }

  sendMessage(): void {
    if (!this.selectedConversation) return;

    const trimmed = this.messageText.trim();
    if (!trimmed && !this.attachmentFile) return;

    if (this.isSending) return;
    this.isSending = true;
    this.attachmentUploadError = null;

    const finalizeSend = (attachmentUrl?: string | null) => {
      this.chatService.sendMessage(this.selectedConversation!.id, {
        content: trimmed,
        attachmentUrl: attachmentUrl ?? null
      });
      this.messageText = '';
      this.clearAttachment();
      this.isSending = false;
    };

    if (!this.attachmentFile) {
      finalizeSend(null);
      return;
    }

    this.uploadService
      .uploadImage(this.attachmentFile, this.uploadPreset, this.uploadFolder)
      .subscribe({
        next: (url) => finalizeSend(url),
        error: () => {
          this.attachmentUploadError = 'Unable to upload attachment. Sending message without it.';
          finalizeSend(null);
        }
      });
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

  loadMoreMessages(): void {
    if (!this.selectedConversation || this.isLoadingMessages || !this.hasMoreMessages) return;
    this.messagesPage += 1;
    this.loadMessages(false);
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
    const attachmentUrl = message.attachmentUrl ?? message.attachmentURL ?? message.attachment?.url ?? null;
    return {
      ...message,
      content: message.content ?? message.text ?? (attachmentUrl ? 'Attachment' : ''),
      timestamp: message.timestamp ?? message.createdAt ?? new Date().toISOString(),
      senderId: message.senderId ?? message.sender?.id,
      senderName: message.senderName ?? message.sender?.name,
      senderAvatarUrl: message.senderAvatarUrl ?? message.sender?.avatarUrl ?? null,
      attachmentUrl,
      conversationId: message.conversationId,
      isMine: typeof message.isMine === 'boolean'
        ? message.isMine
        : Boolean(message.senderId === this.currentUserId)
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

  onAttachmentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.attachmentUploadError = 'Only image attachments are supported right now.';
      this.clearAttachment();
      return;
    }

    this.attachmentFile = file;
    this.attachmentPreviewUrl = URL.createObjectURL(file);
    this.attachmentUploadError = null;
  }

  clearAttachment(): void {
    if (this.attachmentPreviewUrl) {
      URL.revokeObjectURL(this.attachmentPreviewUrl);
    }
    this.attachmentFile = null;
    this.attachmentPreviewUrl = null;
    this.attachmentUploadError = null;
  }

  private loadMessages(reset: boolean): void {
    if (!this.selectedConversation) return;

    this.isLoadingMessages = true;
    const params = new HttpParams()
      .set('page', this.messagesPage.toString())
      .set('pageSize', this.pageSize.toString());

    this.http.get<any[]>(`/api/chat/messages/${this.selectedConversation.id}`, { params })
      .subscribe({
        next: (msgs) => {
          const normalized = msgs.map((msg) => this.normalizeMessage(msg));
          if (reset) {
            this.messages = normalized;
          } else {
            this.messages = [...normalized, ...this.messages];
          }
          this.hasMoreMessages = normalized.length === this.pageSize;
          this.isLoadingMessages = false;
        },
        error: () => {
          this.isLoadingMessages = false;
        }
      });
  }

  private markConversationRead(conversationId: string): void {
    this.http.post(`/api/chat/conversations/${conversationId}/read`, {}).subscribe({
      next: () => {},
      error: () => {}
    });
  }

}
