import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupportHubSignalRService, SupportChatMessageDto } from '../../services/support-hub-signalr.service';
import { SupportHubChatApiService, SupportChatSendMessageRequest } from '../../services/support-hub-chat-api.service';
import { SupportHubSoundService } from '../../services/support-hub-sound.service';
import { ChatWindowComponent, ChatMessage } from '../../components/chat-window/chat-window.component';

@Component({
  selector: 'app-support-hub-chat',
  standalone: true,
  imports: [CommonModule, ChatWindowComponent],
  templateUrl: './support-hub-chat.component.html',
  styleUrl: './support-hub-chat.component.scss',
})
export class SupportHubChatComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private signalR = inject(SupportHubSignalRService);
  private chatApi = inject(SupportHubChatApiService);
  private soundService = inject(SupportHubSoundService);
  private destroy$ = new Subject<void>();

  sessionId = '';
  currentUserName = '';
  agentName = 'Support Agent';
  agentOnline = true;
  sessionEnded = false;
  isTyping = false;
  messages: ChatMessage[] = [];
  messageText = '';

  isConnecting = false;

  get soundEnabled(): boolean { return this.soundService.isSoundEnabled(); }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.currentUserName = sessionStorage.getItem('support-hub-customer-name') || 'Customer';
    this.loadMessages();
    this.initSignalR();
  }

  private async initSignalR(): Promise<void> {
    this.isConnecting = true;
    try {
      await this.signalR.startConnection();
      await this.signalR.joinSession(this.sessionId);

      this.signalR.messages$.pipe(takeUntil(this.destroy$)).subscribe(msg => {
        this.messages = [...this.messages, this.mapToViewMessage(msg)];
        this.soundService.playNewMessageSound();
      });

      this.signalR.userTyping$.pipe(takeUntil(this.destroy$)).subscribe(({ isTyping }) => {
        this.isTyping = isTyping;
      });

      this.signalR.sessionClosed$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.sessionEnded = true;
      });
    } catch (err) {
      console.error('SignalR connection failed:', err);
    } finally {
      this.isConnecting = false;
    }
  }

  private loadMessages(): void {
    this.chatApi.getMessages(this.sessionId).subscribe(msgs => {
      this.messages = msgs.map(m => this.mapToViewMessage(m));
    });
  }

  onSendMessage(content: string): void {
    const request: SupportChatSendMessageRequest = {
      sessionId: this.sessionId,
      senderId: null,
      senderName: this.currentUserName,
      senderRole: 0,
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
        senderName: this.currentUserName,
        senderRole: 0,
        content: '',
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileSize: res.fileSize
      };
      this.chatApi.sendMessage(request).subscribe();
    });
  }

  onToggleSound(): void {
    this.soundService.toggleSound();
  }

  private mapToViewMessage(msg: SupportChatMessageDto): ChatMessage {
    return {
      id: msg.id,
      text: msg.content || null,
      senderName: msg.senderName,
      sentAt: msg.sentAt,
      perspective: msg.senderRole === 0 ? 'outbound' : 'inbound',
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
