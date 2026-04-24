import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { NgScrollbar, NgScrollbarModule } from 'ngx-scrollbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { ChatService } from './services/chat.service';
import { FileUploadService } from '../branding/services/file-upload.service';
import { EmployeeService } from '../employees/services/employee.service';
import { CustomersService } from '../customer/services/customer.service';
import { Employee } from '../employees/models/employee';
import { Client } from '../customer/models/customer';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  id?: string;
  content: string;
  timestamp: string;
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentURL?: string | null;
  attachment?: {
    url?: string | null;
  };
  text?: string;
  sentAt?: string;
  createdAt?: string;
  sender?: {
    id?: string;
    name?: string;
    avatarUrl?: string | null;
  };
  conversationId?: string;
  isMine: boolean;
  isRead?: boolean;
  smsStatus?: 'sending' | 'sent' | 'failed' | null;
  [key: string]: unknown;
}

interface ChatConversation {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  title?: string;
  participantName?: string;
  displayName?: string;
  imageUrl?: string | null;
  photoUrl?: string | null;
  subtitle?: string;
  participantRole?: string;
  starred?: boolean;
  [key: string]: unknown;
}

interface ChatContact {
  id: string;
  type: 'employee' | 'client';
  name: string;
  role?: string;
  avatarUrl?: string | null;
  status?: string;
  phoneNumber?: string | null;
  email?: string | null;
  userId?: string | null;
  hasClientHub?: boolean;
}

interface SmsStatusEvent {
  conversationId?: string;
  messageId?: string;
  status?: string;
  to?: string;
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
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private http = inject(HttpClient);
  private uploadService = inject(FileUploadService);
  private employeeService = inject(EmployeeService);
  private customersService = inject(CustomersService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chatBodyScrollbar', { read: NgScrollbar }) chatBodyScrollbar?: NgScrollbar;
  @ViewChild('replyEditor') replyEditorEl?: ElementRef<HTMLDivElement>;
  @ViewChild('composeEditor') composeEditorEl?: ElementRef<HTMLDivElement>;
  private auth = inject(Auth);
  private readonly apiBaseUrl = environment.apiUrl.replace(/\/$/, '');
  conversations: ChatConversation[] = [];
  contacts: ChatContact[] = [];
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  messageText = '';
  searchQuery = '';
  defaultNavActiveId = 1;
  chatPanelVisible = false;
  showInfoPanel = false;
  currentUserId = '';
  readonly pageSize = 50;
  private messagesPage = 1;
  hasMoreMessages = false;
  isLoadingMessages = false;
  isSending = false;
  attachmentFile: File | null = null;
  attachmentPreviewUrl: string | null = null;
  attachmentUploadError: string | null = null;
  isLoadingContacts = false;
  isRemoteTyping = false;
  activeFolder: 'all' | 'unread' | 'starred' | 'sent' = 'all';
  composePanelOpen = false;
  composeSubject = '';
  composeTo = '';
  composeBodyText = '';
  private typingTimeoutId: number | null = null;
  private typingIndicatorTimeoutId: number | null = null;
  private readonly uploadPreset = 'company_logos_unsigned';
  private readonly uploadFolder = 'jobflow/chat';

  ngOnInit(): void {
    this.currentUserId = this.auth.currentUser?.uid ?? '';
    this.chatService.startConnection();
    this.loadConversations();
    this.loadContacts();

    this.chatService.onMessageReceived((message) => {
      const normalizedMessage = this.normalizeMessage(message as unknown as ChatMessage, true);
      this.updateConversationPreview(normalizedMessage.conversationId, normalizedMessage, normalizedMessage.isMine);

      if (normalizedMessage.conversationId === this.selectedConversation?.id) {
        this.messages = [...this.messages, normalizedMessage];
        if (normalizedMessage.conversationId) {
          this.resetUnreadCount(normalizedMessage.conversationId);
          this.markConversationRead(normalizedMessage.conversationId);
        }
        this.scrollToBottom();
      }
      this.cdr.markForCheck();
    });

    this.chatService.onSmsStatus((status: SmsStatusEvent) => {
      if (!status?.status) return;
      if (!status.messageId) return;
      if (!this.selectedConversation || status.conversationId !== this.selectedConversation.id) return;

      this.messages = this.messages.map((message) => (
        message.id === status.messageId
          ? { ...message, smsStatus: status.status as ChatMessage['smsStatus'] }
          : message
      ));
      this.cdr.markForCheck();
    });

    this.chatService.onTyping((payload) => {
      if (!payload?.conversationId || payload.conversationId !== this.selectedConversation?.id) return;
      if (payload.senderType !== 'client') return;

      this.isRemoteTyping = Boolean(payload.isTyping);
      if (this.typingIndicatorTimeoutId) {
        window.clearTimeout(this.typingIndicatorTimeoutId);
      }

      if (this.isRemoteTyping) {
        this.typingIndicatorTimeoutId = window.setTimeout(() => {
          this.isRemoteTyping = false;
          this.cdr.markForCheck();
        }, 2500);
      }
      this.cdr.markForCheck();
    });

    this.chatService.onReadReceipt((payload) => {
      if (!payload?.conversationId || payload.conversationId !== this.selectedConversation?.id) return;
      if (!Array.isArray(payload.messageIds)) return;

      const readIds = new Set(payload.messageIds);
      this.messages = this.messages.map((message) => (
        readIds.has(message.id)
          ? { ...message, isRead: true }
          : message
      ));
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.typingTimeoutId) {
      window.clearTimeout(this.typingTimeoutId);
    }
    if (this.typingIndicatorTimeoutId) {
      window.clearTimeout(this.typingIndicatorTimeoutId);
    }
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }
  }

  loadConversations() {
    this.http.get<ChatConversation[]>(`${this.apiBaseUrl}/chat/conversations`).subscribe({
      next: (convos) => {
        const selectedConversationId = this.selectedConversation?.id;
        this.conversations = convos.map((convo) => this.normalizeConversation(convo));

        if (selectedConversationId) {
          const matchedConversation = this.conversations.find((convo) => convo.id === selectedConversationId) ?? null;

          if (!matchedConversation) {
            this.selectedConversation = null;
            this.messages = [];
            this.chatPanelVisible = false;
            this.hasMoreMessages = false;
            this.isRemoteTyping = false;
            this.cdr.markForCheck();
            return;
          }

          this.selectedConversation = matchedConversation;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  loadContacts(): void {
    this.isLoadingContacts = true;

    forkJoin({
      employees: this.employeeService.getByOrganization(),
      clients: this.customersService.getAllByOrganization()
    }).subscribe({
      next: ({ employees, clients }) => {
        const employeeContacts = (employees || []).map((employee) => this.mapEmployeeContact(employee));
        const clientContacts = (clients || []).map((client) => this.mapClientContact(client));

        this.contacts = [...employeeContacts, ...clientContacts]
          .filter((contact) => contact.id)
          .sort((left, right) => left.name.localeCompare(right.name));
        this.isLoadingContacts = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingContacts = false;
        this.cdr.markForCheck();
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
    this.scrollToBottom();
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
      if (this.replyEditorEl?.nativeElement) {
        this.replyEditorEl.nativeElement.innerHTML = '';
      }
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
          this.cdr.markForCheck();
        }
      });
  }

  startNewChat(): void {
    this.defaultNavActiveId = 3;
    this.searchQuery = '';
  }

  loadMoreMessages(): void {
    if (!this.selectedConversation || this.isLoadingMessages || !this.hasMoreMessages) return;
    this.messagesPage += 1;
    this.loadMessages(false);
  }

  backToChatList(): void {
    this.chatPanelVisible = false;
  }

  toggleInfoPanel(): void {
    this.showInfoPanel = !this.showInfoPanel;
    this.cdr.markForCheck();
  }

  getConversationChannel(convo: ChatConversation | null | undefined): string {
    const role = (convo?.role ?? '').toLowerCase();
    if (role.includes('sms') || convo?.['phoneNumber']) return 'sms';
    if (role.includes('hub') || role.includes('client')) return 'hub';
    return 'internal';
  }

  getLastSeenText(convo: ChatConversation | null | undefined): string {
    if (!convo) return '';
    return (convo.status ?? 'online') === 'offline' ? 'Offline' : 'Online';
  }

  getConversationSubject(convo: ChatConversation | null | undefined): string {
    if (!convo) return '';
    const channel = this.getConversationChannel(convo);
    const name = this.getConversationName(convo);
    if (channel === 'sms')      return `SMS with ${name}`;
    if (channel === 'hub')      return `Client Hub — ${name}`;
    return `Conversation with ${name}`;
  }

  openCompose(): void {
    this.composePanelOpen = true;
    this.composeSubject = '';
    this.composeTo = '';
    this.composeBodyText = '';
    this.clearAttachment();
    this.cdr.markForCheck();
  }

  closeCompose(): void {
    this.composePanelOpen = false;
    if (this.composeEditorEl?.nativeElement) {
      this.composeEditorEl.nativeElement.innerHTML = '';
    }
    this.clearAttachment();
    this.cdr.markForCheck();
  }

  setFolder(folder: 'all' | 'unread' | 'starred' | 'sent'): void {
    this.activeFolder = folder;
    this.cdr.markForCheck();
  }

  toggleStar(convo: ChatConversation | null | undefined, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!convo) return;
    convo.starred = !convo.starred;
    this.cdr.markForCheck();
  }

  toggleReadState(convo: ChatConversation | null | undefined): void {
    if (!convo) return;
    if ((convo.unreadCount ?? 0) > 0) {
      this.resetUnreadCount(convo.id);
    } else {
      this.conversations = this.conversations.map((c) =>
        c.id === convo.id ? { ...c, unreadCount: 1 } : c
      );
      if (this.selectedConversation?.id === convo.id) {
        this.selectedConversation = { ...this.selectedConversation, unreadCount: 1 };
      }
    }
    this.cdr.markForCheck();
  }

  markAllRead(): void {
    this.conversations = this.conversations.map((c) => ({ ...c, unreadCount: 0 }));
    if (this.selectedConversation) {
      this.selectedConversation = { ...this.selectedConversation, unreadCount: 0 };
    }
    this.cdr.markForCheck();
  }

  execFormat(command: string): void {
    // document.execCommand is deprecated but remains the simplest cross-browser
    // approach for inline rich-text formatting on contenteditable without a library.
    document.execCommand(command, false, undefined);
  }

  onReplyInput(event: Event): void {
    this.messageText = (event.target as HTMLElement).innerText || '';
    this.notifyTyping();
  }

  onComposeInput(event: Event): void {
    this.composeBodyText = (event.target as HTMLElement).innerText || '';
  }

  sendComposedMessage(): void {
    if (!this.composeTo.trim()) return;
    const contact = this.filteredContacts.find(
      (c) => c.name.toLowerCase() === this.composeTo.trim().toLowerCase()
    );
    if (contact) {
      this.openContactChat(contact);
    }
    this.closeCompose();
  }

  get filteredConversations(): ChatConversation[] {
    const query = this.searchQuery.trim().toLowerCase();
    let result = this.conversations;

    switch (this.activeFolder) {
      case 'unread':   result = result.filter((c) => (c.unreadCount ?? 0) > 0); break;
      case 'starred':  result = result.filter((c) => Boolean(c.starred));       break;
      case 'sent':     result = result.filter((c) => Boolean(c.lastMessage?.isMine)); break;
    }

    if (!query) return result;

    return result.filter((convo) => {
      const haystack = [
        convo.name,
        convo.role,
        convo.lastMessage?.content
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get totalUnreadCount(): number {
    return this.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  }

  get contactConversations(): ChatConversation[] {
    return [...this.filteredConversations].sort((left, right) => left.name.localeCompare(right.name));
  }

  get filteredContacts(): ChatContact[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.contacts;
    }

    return this.contacts.filter((contact) => {
      const haystack = [
        contact.name,
        contact.role,
        contact.phoneNumber,
        contact.email
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get employeeContacts(): ChatContact[] {
    return this.filteredContacts.filter((contact) => contact.type === 'employee');
  }

  get clientContacts(): ChatContact[] {
    return this.filteredContacts.filter((contact) => contact.type === 'client');
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

  getContactSubtitle(contact: ChatContact): string {
    if (contact.type === 'employee') {
      return contact.role ?? contact.email ?? 'Employee';
    }

    if (contact.phoneNumber) {
      return contact.phoneNumber;
    }

    return contact.hasClientHub ? 'Client Hub linked' : 'SMS not available';
  }

  getContactBadge(contact: ChatContact): string {
    return contact.type === 'employee' ? 'Team' : 'Client';
  }

  canStartClientChat(contact: ChatContact): boolean {
    return contact.type !== 'client' || Boolean(contact.phoneNumber || contact.hasClientHub);
  }

  notifyTyping(): void {
    if (!this.selectedConversation) return;

    if (this.typingTimeoutId) {
      window.clearTimeout(this.typingTimeoutId);
    }

    this.chatService.sendTyping(this.selectedConversation.id, true);
    this.typingTimeoutId = window.setTimeout(() => {
      if (this.selectedConversation) {
        this.chatService.sendTyping(this.selectedConversation.id, false);
      }
    }, 1800);
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

  trackByContactId(_index: number, contact: ChatContact): string {
    return contact.id;
  }

  trackByMessage(_index: number, message: ChatMessage): string {
    return message.id ?? `${message.timestamp}-${message.content}`;
  }

  openContactChat(contact: ChatContact): void {
    if (contact.type === 'employee') {
      if (!contact.userId) {
        alert('This employee does not have an active user account yet.');
        return;
      }

      this.http.post<ChatConversation>(`${this.apiBaseUrl}/chat/conversations`, {
        participantIds: [contact.userId]
      }).subscribe({
        next: (newConvo) => {
          const normalizedConversation = this.normalizeConversation(newConvo);
          this.conversations = [
            normalizedConversation,
            ...this.conversations.filter((convo) => convo.id !== normalizedConversation.id)
          ];
          this.selectConversation(normalizedConversation);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.http.post<ChatConversation>(`${this.apiBaseUrl}/chat/conversations/client`, {
      organizationClientId: contact.id
    }).subscribe({
      next: (newConvo) => {
        const normalizedConversation = this.normalizeConversation(newConvo);
        this.conversations = [
          normalizedConversation,
          ...this.conversations.filter((convo) => convo.id !== normalizedConversation.id)
        ];
        this.selectConversation(normalizedConversation);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  private isClientConversation(convo: ChatConversation): boolean {
    return (convo.role ?? '').toLowerCase() === 'client';
  }

  getMessageStatusLabel(message: ChatMessage): string | null {
    if (message.isMine && message.isRead) {
      return 'Read';
    }

    if (message.smsStatus === 'sending') {
      return 'Sending...';
    }

    if (message.smsStatus === 'sent') {
      return 'Sent';
    }

    if (message.smsStatus === 'failed') {
      return 'Failed';
    }

    return null;
  }

  private normalizeConversation(convo: ChatConversation): ChatConversation {
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

  private normalizeMessage(message: ChatMessage, fromRealtime = false): ChatMessage {
    const attachmentUrl = message.attachmentUrl ?? message.attachmentURL ?? message.attachment?.url ?? null;
    const isMine = typeof message.isMine === 'boolean'
      ? message.isMine
      : Boolean(message.senderId === this.currentUserId);
    const isClientChat = this.selectedConversation
      ? this.isClientConversation(this.selectedConversation)
      : false;

    return {
      ...message,
      content: message.content ?? message.text ?? (attachmentUrl ? 'Attachment' : ''),
      timestamp: message.sentAt ?? message.timestamp ?? message.createdAt ?? new Date().toISOString(),
      senderId: message.senderId ?? message.sender?.id,
      senderName: message.senderName ?? message.sender?.name,
      senderAvatarUrl: message.senderAvatarUrl ?? message.sender?.avatarUrl ?? null,
      attachmentUrl,
      conversationId: message.conversationId,
      isMine,
      isRead: Boolean(message.isRead),
      smsStatus: fromRealtime && isClientChat && isMine ? 'sending' : null
    };
  }

  private mapEmployeeContact(employee: Employee): ChatContact {
    return {
      id: employee.id,
      type: 'employee',
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      role: employee.role ?? 'Employee',
      status: employee.isActive ? 'online' : 'offline',
      phoneNumber: employee.phoneNumber ?? null,
      email: employee.email ?? null,
      userId: employee.userId ?? null,
      avatarUrl: null,
      hasClientHub: false
    };
  }

  private mapClientContact(client: Client): ChatContact {
    const hasClientHub = Boolean(client.emailAddress);
    return {
      id: client.id ?? '',
      type: 'client',
      name: `${client.firstName} ${client.lastName}`.trim() || 'Client',
      role: 'Client',
      status: client.phoneNumber ? 'online' : 'offline',
      phoneNumber: client.phoneNumber ?? null,
      email: client.emailAddress ?? null,
      userId: null,
      avatarUrl: null,
      hasClientHub
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

    this.http.get<ChatMessage[]>(`${this.apiBaseUrl}/chat/messages/${this.selectedConversation.id}`, { params })
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
          if (reset) {
            this.scrollToBottom();
          }
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingMessages = false;
          this.cdr.markForCheck();

          if (error.status === 403) {
            this.handleConversationAccessDenied(this.selectedConversation?.id);
          }
        }
      });
  }

  private markConversationRead(conversationId: string): void {
    this.http.post(`${this.apiBaseUrl}/chat/conversations/${conversationId}/read`, {}).subscribe({
      next: () => undefined,
      error: (error: HttpErrorResponse) => {
        if (error.status === 403) {
          this.handleConversationAccessDenied(conversationId);
        }
      }
    });
  }

  private handleConversationAccessDenied(conversationId: string | undefined): void {
    if (!conversationId) {
      return;
    }

    this.conversations = this.conversations.filter((convo) => convo.id !== conversationId);

    if (this.selectedConversation?.id === conversationId) {
      this.selectedConversation = null;
      this.messages = [];
      this.chatPanelVisible = false;
      this.hasMoreMessages = false;
      this.isRemoteTyping = false;
    }

    this.loadConversations();
  }

  scrollToBottom(): void {
    if (!this.chatBodyScrollbar) return;
    setTimeout(() => {
      this.chatBodyScrollbar?.scrollTo({ bottom: 0, duration: 0 });
    }, 0);
  }

}
