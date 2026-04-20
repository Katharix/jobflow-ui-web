import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupportHubChatApiService, SupportChatSendMessageRequest, SupportChatSessionDto } from '../../services/support-hub-chat-api.service';
import { SupportHubSignalRService, SupportChatMessageDto } from '../../services/support-hub-signalr.service';
import { SupportHubSoundService } from '../../services/support-hub-sound.service';
import { ChatWindowComponent, ChatMessage } from '../../components/chat-window/chat-window.component';
import { ChatSidebarComponent, ChatSidebarCustomer } from './components/chat-sidebar/chat-sidebar.component';
import { ChatQueueComponent } from './components/chat-queue/chat-queue.component';
import { QueueCardComponent, QueueCustomer } from '../../components/queue-card/queue-card.component';

@Component({
  selector: 'app-support-hub-live-chat',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatWindowComponent, ChatSidebarComponent, ChatQueueComponent, QueueCardComponent],
  templateUrl: './support-hub-live-chat.component.html',
  styleUrl: './support-hub-live-chat.component.scss',
})
export class SupportHubLiveChatComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chatApi = inject(SupportHubChatApiService);
  private signalR = inject(SupportHubSignalRService);
  private soundService = inject(SupportHubSoundService);

  sessionId = '';
  customerName = '';
  customerOrg = '';
  customerEmail = '';
  sessionStartedAt = '';
  isTyping = false;
  messages: ChatMessage[] = [];
  queuedCustomers: QueueCustomer[] = [];
  messageText = '';
  sidebarOpen = true;
  queuePanelOpen = true;
  sidebarCustomer: ChatSidebarCustomer | null = null;

  get soundEnabled(): boolean { return this.soundService.isSoundEnabled(); }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.loadSession();
    this.loadMessages();
    this.loadQueue();
    this.initSignalR();
  }

  private loadSession(): void {
    this.chatApi.getSession(this.sessionId).subscribe({
      next: (session: SupportChatSessionDto) => {
        this.customerName = session.customerName;
        this.customerEmail = session.customerEmail;
        this.sessionStartedAt = session.startedAt ?? session.createdAt;
        this.sidebarCustomer = {
          name: session.customerName,
          email: session.customerEmail,
          organizationName: '',
          sessionId: session.id,
          sessionStartedAt: session.startedAt ?? session.createdAt
        };
      }
    });
  }

  private loadMessages(): void {
    this.chatApi.getMessages(this.sessionId).subscribe(msgs => {
      this.messages = msgs.map(m => this.mapToViewMessage(m));
    });
  }

  private loadQueue(): void {
    this.chatApi.getQueue().subscribe({
      next: (items) => {
        this.queuedCustomers = items
          .filter(item => item.sessionId !== this.sessionId)
          .map(item => ({
            id: item.sessionId,
            name: item.customerName,
            organizationName: item.customerEmail,
            waitMinutes: Math.ceil(item.estimatedWaitSeconds / 60),
            position: item.queuePosition,
            avatarInitials: item.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            avatarColor: undefined
          }));
      }
    });
  }

  private async initSignalR(): Promise<void> {
    await this.signalR.startConnection();
    await this.signalR.joinSession(this.sessionId);
    await this.signalR.joinRepGroup();

    this.signalR.messages$.subscribe(msg => {
      this.messages.push(this.mapToViewMessage(msg));
      this.soundService.playNewMessageSound();
    });

    this.signalR.userTyping$.subscribe(({ isTyping }) => {
      this.isTyping = isTyping;
    });

    this.signalR.queueUpdated$.subscribe(() => this.loadQueue());
  }

  onSendMessage(content: string): void {
    const request: SupportChatSendMessageRequest = {
      sessionId: this.sessionId,
      senderId: null,
      senderName: 'Support Rep',
      senderRole: 1,
      content,
      fileUrl: null,
      fileName: null,
      fileSize: null
    };
    this.chatApi.sendMessage(request).subscribe();
  }

  onFileSelected(file: File): void {
    this.chatApi.uploadFile(this.sessionId, file).subscribe(res => {
      const request: SupportChatSendMessageRequest = {
        sessionId: this.sessionId,
        senderId: null,
        senderName: 'Support Rep',
        senderRole: 1,
        content: '',
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileSize: res.fileSize
      };
      this.chatApi.sendMessage(request).subscribe();
    });
  }

  onEndSession(): void {
    this.chatApi.closeSession(this.sessionId).subscribe(() => {
      this.router.navigate(['/support-hub/queue']);
    });
  }

  onPickFromQueue(customerId: string): void {
    this.chatApi.pickCustomer(customerId).subscribe(() => {
      this.router.navigate(['/support-hub/live-chat', customerId]);
    });
  }

  onToggleSound(): void {
    this.soundService.toggleSound();
  }

  onToggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onToggleQueuePanel(): void {
    this.queuePanelOpen = !this.queuePanelOpen;
  }

  private mapToViewMessage(msg: SupportChatMessageDto): ChatMessage {
    return {
      id: msg.id,
      text: msg.content || null,
      senderName: msg.senderName,
      sentAt: msg.sentAt,
      perspective: msg.senderRole === 1 ? 'outbound' : 'inbound',
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize
    };
  }

  ngOnDestroy(): void {
    this.signalR.leaveSession(this.sessionId);
  }
}
