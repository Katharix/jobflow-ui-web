import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupportHubChatApiService, SupportChatSendMessageRequest, SupportChatSessionDto } from '../../services/support-hub-chat-api.service';
import { SupportHubSignalRService, SupportChatMessageDto } from '../../services/support-hub-signalr.service';
import { SupportHubSoundService } from '../../services/support-hub-sound.service';
import { ChatWindowComponent, ChatMessage } from '../../components/chat-window/chat-window.component';
import { QueueCardComponent, QueueCustomer } from '../../components/queue-card/queue-card.component';

@Component({
  selector: 'app-support-hub-live-chat',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatWindowComponent, QueueCardComponent],
  templateUrl: './support-hub-live-chat.component.html',
  styleUrl: './support-hub-live-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubLiveChatComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chatApi = inject(SupportHubChatApiService);
  private signalR = inject(SupportHubSignalRService);
  private soundService = inject(SupportHubSoundService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

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
  sidebarCustomer: { name: string; email: string; organizationName: string; sessionId: string; sessionStartedAt: string; } | null = null;

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
        this.cdr.markForCheck();
      }
    });
  }

  private loadMessages(): void {
    this.chatApi.getMessages(this.sessionId).subscribe(msgs => {
      this.messages = msgs.map(m => this.mapToViewMessage(m));
      this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      }
    });
  }

  private async initSignalR(): Promise<void> {
    await this.signalR.startConnection();
    await this.signalR.joinSession(this.sessionId);
    await this.signalR.joinRepGroup();

    this.signalR.messages$.pipe(takeUntil(this.destroy$)).subscribe(msg => {
      this.messages = [...this.messages, this.mapToViewMessage(msg)];
      this.soundService.playNewMessageSound();
      this.cdr.markForCheck();
    });

    this.signalR.userTyping$.pipe(takeUntil(this.destroy$)).subscribe(({ isTyping }) => {
      this.isTyping = isTyping;
      this.cdr.markForCheck();
    });

    this.signalR.queueUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadQueue();
      this.cdr.detectChanges();
    });
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

  onRemoveFromQueue(customerId: string): void {
    this.chatApi.removeFromQueue(customerId).subscribe(() => this.loadQueue());
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
    this.destroy$.next();
    this.destroy$.complete();
    this.signalR.leaveSession(this.sessionId);
  }
}
