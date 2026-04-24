import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupportHubSignalRService, SupportChatMessageDto } from './support-hub-signalr.service';
import { SupportHubChatApiService, SupportChatQueueItemDto, SupportChatSessionDto } from './support-hub-chat-api.service';

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export interface RepChatMessage {
  id: string;
  content: string;
  sender: 'rep' | 'customer';
  senderName: string;
  timestamp: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export type RepPanelPhase = 'hidden' | 'queue' | 'prompt' | 'chat';

export interface RepChatPanelState {
  phase: RepPanelPhase;
  queueItems: SupportChatQueueItemDto[];
  queueCount: number;
  pendingItem: SupportChatQueueItemDto | null;
  activeSession: SupportChatSessionDto | null;
  messages: RepChatMessage[];
  isCustomerTyping: boolean;
  isUploading: boolean;
  isSending: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class RepChatPanelService implements OnDestroy {
  private readonly signalR = inject(SupportHubSignalRService);
  private readonly chatApi = inject(SupportHubChatApiService);
  private readonly destroy$ = new Subject<void>();

  private typingResetTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly initial: RepChatPanelState = {
    phase: 'hidden',
    queueItems: [],
    queueCount: 0,
    pendingItem: null,
    activeSession: null,
    messages: [],
    isCustomerTyping: false,
    isUploading: false,
    isSending: false,
    error: null,
  };

  private readonly stateSubject = new BehaviorSubject<RepChatPanelState>({ ...this.initial });
  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): RepChatPanelState {
    return this.stateSubject.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Connection ────────────────────────────────────────────────────────────

  connect(): void {
    this.signalR.startConnection().then(() => {
      void this.signalR.joinRepGroup();
      this.refreshQueue();
    });

    // New messages from customer
    this.signalR.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg: SupportChatMessageDto) => {
        if (msg.senderRole !== 0) return; // only customer messages
        const activeSession = this.snapshot.activeSession;
        if (!activeSession || msg.sessionId !== activeSession.id) return;

        this.appendMessage({
          id: msg.id,
          content: msg.content,
          sender: 'customer',
          senderName: msg.senderName,
          timestamp: new Date(msg.sentAt),
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
        });
      });

    // Queue updated — check for next user
    this.signalR.queueUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshQueue());

    // Session closed by customer or system
    this.signalR.sessionClosed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onSessionClosed());

    // Customer typing indicator
    this.signalR.userTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.patch({ isCustomerTyping: event.isTyping });
        if (event.isTyping) {
          if (this.typingResetTimer) clearTimeout(this.typingResetTimer);
          this.typingResetTimer = setTimeout(() => this.patch({ isCustomerTyping: false }), 4000);
        }
      });
  }

  disconnect(): void {
    void this.signalR.disconnect();
    this.stateSubject.next({ ...this.initial });
  }

  // ── Panel Visibility ──────────────────────────────────────────────────────

  openPanel(): void {
    const { phase, queueCount, activeSession } = this.snapshot;
    if (phase === 'hidden') {
      if (activeSession) {
        this.patch({ phase: 'chat' });
      } else if (queueCount > 0) {
        this.patch({ phase: 'queue' });
      } else {
        this.patch({ phase: 'queue' }); // show empty queue
      }
    }
  }

  closePanel(): void {
    this.patch({ phase: 'hidden' });
  }

  // ── Queue Management ──────────────────────────────────────────────────────

  refreshQueue(): void {
    this.chatApi.getQueue().subscribe({
      next: (items) => {
        const queueCount = items.length;
        const { phase, activeSession } = this.snapshot;

        this.patch({ queueItems: items, queueCount });

        // If no active session and queue has items — show prompt for first item
        if (!activeSession && queueCount > 0 && phase !== 'prompt' && phase !== 'chat') {
          this.patch({ pendingItem: items[0], phase: 'prompt' });
        }
      },
      error: () => { /* silent */ },
    });
  }

  /** Rep accepts the pending customer */
  acceptCustomer(): void {
    const { pendingItem } = this.snapshot;
    if (!pendingItem) return;

    this.chatApi.pickCustomer(pendingItem.sessionId).subscribe({
      next: (session) => {
        void this.signalR.joinSession(session.id);
        this.patch({
          activeSession: session,
          pendingItem: null,
          phase: 'chat',
          messages: [],
          error: null,
        });
        // Remove from queue list
        this.chatApi.getMessages(session.id).subscribe({
          next: (msgs) => {
            const mapped: RepChatMessage[] = msgs.map((m) => ({
              id: m.id,
              content: m.content,
              sender: m.senderRole === 0 ? 'customer' : 'rep',
              senderName: m.senderName,
              timestamp: new Date(m.sentAt),
              fileUrl: m.fileUrl,
              fileName: m.fileName,
              fileSize: m.fileSize,
            }));
            this.patch({ messages: mapped });
          },
          error: () => { /* silent — start with empty messages */ },
        });
      },
      error: (err) => {
        const msg = (err?.error as { message?: string })?.message ?? 'Failed to accept customer.';
        this.patch({ error: msg });
      },
    });
  }

  /** Rep declines — push customer back, show next in queue */
  declineCustomer(): void {
    const { queueItems } = this.snapshot;
    // Move past the first item; next prompt will appear on next QueueUpdated
    const remaining = queueItems.slice(1);
    const nextPending = remaining.length > 0 ? remaining[0] : null;
    this.patch({
      pendingItem: nextPending,
      queueItems: remaining,
      queueCount: remaining.length,
      phase: nextPending ? 'prompt' : 'queue',
    });
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  sendMessage(content: string, repName: string): void {
    const { activeSession } = this.snapshot;
    if (!activeSession || !content.trim()) return;

    this.appendMessage({
      id: crypto.randomUUID(),
      content: content.trim(),
      sender: 'rep',
      senderName: repName,
      timestamp: new Date(),
      fileUrl: null,
      fileName: null,
      fileSize: null,
    });

    void this.signalR.sendMessage(activeSession.id, content.trim());
  }

  sendFile(file: File, repName: string): void {
    const { activeSession } = this.snapshot;
    if (!activeSession) return;
    if (file.size > 10 * 1024 * 1024) {
      this.patch({ error: 'File must be under 10 MB.' });
      return;
    }
    this.patch({ isUploading: true, error: null });

    this.chatApi.uploadFile(activeSession.id, file).subscribe({
      next: (res) => {
        this.patch({ isUploading: false });
        this.appendMessage({
          id: crypto.randomUUID(),
          content: '',
          sender: 'rep',
          senderName: repName,
          timestamp: new Date(),
          fileUrl: res.fileUrl,
          fileName: res.fileName,
          fileSize: res.fileSize,
        });
        void this.signalR.sendMessage(activeSession.id, `[File: ${res.fileName}]`);
      },
      error: () => {
        this.patch({ isUploading: false, error: 'File upload failed.' });
      },
    });
  }

  notifyTyping(isTyping: boolean): void {
    const { activeSession } = this.snapshot;
    if (!activeSession) return;
    if (isTyping) {
      void this.signalR.startTyping(activeSession.id);
    } else {
      void this.signalR.stopTyping(activeSession.id);
    }
  }

  // ── End Session ───────────────────────────────────────────────────────────

  endSession(): void {
    const { activeSession } = this.snapshot;
    if (activeSession) {
      this.chatApi.closeSession(activeSession.id).subscribe({ error: () => { /* silent */ } });
      void this.signalR.leaveSession(activeSession.id);
    }
    this.patch({ activeSession: null, messages: [], phase: 'queue' });
    this.refreshQueue();
  }

  clearError(): void {
    this.patch({ error: null });
  }

  promptQueueItem(sessionId: string): void {
    const item = this.snapshot.queueItems.find((q) => q.sessionId === sessionId);
    if (item) {
      this.patch({ pendingItem: item, phase: 'prompt' });
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private onSessionClosed(): void {
    this.patch({ activeSession: null, messages: [], isCustomerTyping: false });
    this.refreshQueue();
    // If queue has items, prompt for next
    const { queueItems } = this.snapshot;
    if (queueItems.length > 0) {
      this.patch({ pendingItem: queueItems[0], phase: 'prompt' });
    } else {
      this.patch({ phase: 'queue' });
    }
  }

  private appendMessage(msg: RepChatMessage): void {
    this.patch({ messages: [...this.snapshot.messages, msg] });
  }

  private patch(partial: Partial<RepChatPanelState>): void {
    this.stateSubject.next({ ...this.snapshot, ...partial });
  }
}
