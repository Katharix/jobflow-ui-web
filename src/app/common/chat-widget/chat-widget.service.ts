import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupportHubSignalRService } from '../../support-hub/services/support-hub-signalr.service';
import { SupportHubChatApiService } from '../../support-hub/services/support-hub-chat-api.service';
import {
  ChatWidgetMessage,
  ChatWidgetPhase,
  ChatWidgetState,
  ChatWidgetUserInfo,
} from './chat-widget.models';

const SESSION_STORAGE_KEY = 'jf_cw_session';
const USER_INFO_KEY = 'jf_cw_user';

const BOT_GREETING =
  "Hi there! 👋 I'm the JobFlow assistant. How can I help you today? Ask me a question or type **representative** to speak with a live support agent.";

const HUMAN_INTENT_RE =
  /\b(representative|rep|human|person|agent|someone|staff|support agent|real person|speak to|talk to|connect me|live help)\b/i;

const CONFIRM_RE = /\b(yes|sure|ok|okay|connect|please|absolutely|yep|yeah)\b/i;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class ChatWidgetService implements OnDestroy {
  private readonly signalR = inject(SupportHubSignalRService);
  private readonly chatApi = inject(SupportHubChatApiService);
  private readonly destroy$ = new Subject<void>();

  /** Tracks whether the last bot message asked the user to confirm human transfer */
  private awaitingConfirm = false;

  private typingResetTimer: ReturnType<typeof setTimeout> | null = null;

  // ── State ────────────────────────────────────────────────────────────────

  private readonly initial: ChatWidgetState = {
    phase: 'collapsed',
    messages: [],
    sessionId: null,
    queuePosition: null,
    estimatedWait: null,
    repName: null,
    userInfo: null,
    isRepTyping: false,
    hasUnread: false,
    isUploading: false,
    error: null,
  };

  private readonly stateSubject = new BehaviorSubject<ChatWidgetState>({ ...this.initial });
  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): ChatWidgetState {
    return this.stateSubject.value;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  constructor() {
    this.restoreSession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public API ───────────────────────────────────────────────────────────

  openWidget(): void {
    if (this.snapshot.phase !== 'collapsed') return;
    this.patch({ phase: 'bot', hasUnread: false });
    if (this.snapshot.messages.length === 0) {
      this.addBotMessage(BOT_GREETING);
    }
  }

  collapseWidget(): void {
    this.patch({ phase: 'collapsed' });
  }

  closeWidget(): void {
    const { phase, sessionId } = this.snapshot;
    if ((phase === 'live' || phase === 'waiting') && sessionId) {
      this.endSession();
    } else {
      this.resetWidget();
    }
  }

  /** Send a message during the bot phase */
  sendBotMessage(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.addUserMessage(trimmed);

    setTimeout(() => {
      const response = this.getBotResponse(trimmed);
      if (response === '__HUMAN_INTENT__') {
        this.awaitingConfirm = false;
        this.addBotMessage(
          "Great! Let me connect you with a live support agent. I just need a few details first."
        );
        setTimeout(() => this.patch({ phase: 'validate' }), 900);
      } else {
        this.addBotMessage(response);
      }
    }, 500);
  }

  /** User submits contact info — join the support queue */
  submitValidation(info: ChatWidgetUserInfo): void {
    this.patch({ userInfo: info, phase: 'waiting', error: null });
    this.saveUserInfo(info);
    this.joinQueue(info);
  }

  cancelValidation(): void {
    this.patch({ phase: 'bot' });
  }

  /** Send a text message during the live phase */
  sendMessage(content: string): void {
    const { sessionId, userInfo } = this.snapshot;
    if (!sessionId || !content.trim()) return;

    const msg: ChatWidgetMessage = {
      id: crypto.randomUUID(),
      content: content.trim(),
      sender: 'user',
      senderName: userInfo?.name ?? 'You',
      timestamp: new Date(),
    };
    this.appendMessage(msg);
    void this.signalR.sendMessage(sessionId, content.trim());
  }

  /** Upload a file and notify the rep */
  sendFile(file: File): void {
    const { sessionId, userInfo } = this.snapshot;
    if (!sessionId) return;
    if (file.size > 10 * 1024 * 1024) {
      this.patch({ error: 'File must be under 10 MB.' });
      return;
    }
    this.patch({ isUploading: true, error: null });

    this.chatApi.uploadFile(sessionId, file).subscribe({
      next: (res) => {
        this.patch({ isUploading: false });
        const msg: ChatWidgetMessage = {
          id: crypto.randomUUID(),
          content: '',
          sender: 'user',
          senderName: userInfo?.name ?? 'You',
          timestamp: new Date(),
          fileUrl: res.fileUrl,
          fileName: res.fileName,
          fileSize: res.fileSize,
        };
        this.appendMessage(msg);
        // Notify rep via SignalR (content = file name as text)
        void this.signalR.sendMessage(sessionId, `[File: ${res.fileName}]`);
      },
      error: () => {
        this.patch({ isUploading: false, error: 'File upload failed. Please try again.' });
      },
    });
  }

  endSession(): void {
    const { sessionId } = this.snapshot;
    if (sessionId) {
      this.chatApi.closeSession(sessionId).subscribe({ error: () => { /* silent */ } });
      void this.signalR.leaveSession(sessionId);
    }
    this.patch({ phase: 'ended' });
    this.clearSession();
    void this.signalR.disconnect();
  }

  startNewChat(): void {
    this.awaitingConfirm = false;
    const savedUser = this.loadUserInfo();
    this.stateSubject.next({ ...this.initial, phase: 'bot', userInfo: savedUser });
    this.addBotMessage(BOT_GREETING);
  }

  /** Call when user starts/stops typing to propagate to the rep */
  notifyTyping(isTyping: boolean): void {
    const { sessionId } = this.snapshot;
    if (!sessionId) return;
    if (isTyping) {
      void this.signalR.startTyping(sessionId);
    } else {
      void this.signalR.stopTyping(sessionId);
    }
  }

  clearError(): void {
    this.patch({ error: null });
  }

  // ── Queue & SignalR ───────────────────────────────────────────────────────

  private joinQueue(info: ChatWidgetUserInfo): void {
    this.chatApi
      .joinQueue({ customerName: info.name, customerEmail: info.email })
      .subscribe({
        next: (res) => {
          this.patch({
            sessionId: res.sessionId,
            queuePosition: res.queuePosition,
            estimatedWait: res.estimatedWaitSeconds,
          });
          this.saveSession(res.sessionId);
          this.connectSignalR(res.sessionId);
        },
        error: (err) => {
          const msg: string =
            (err?.error as { message?: string })?.message ?? 'Failed to join queue. Please try again.';
          this.patch({ phase: 'bot', error: msg });
        },
      });
  }

  private connectSignalR(sessionId: string): void {
    this.signalR.startConnection().then(() => {
      void this.signalR.joinSession(sessionId);
    });

    // Incoming messages from rep
    this.signalR.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg) => {
        if (msg.senderRole !== 1) return; // only rep messages
        const wMsg: ChatWidgetMessage = {
          id: msg.id,
          content: msg.content,
          sender: 'rep',
          senderName: msg.senderName,
          timestamp: new Date(msg.sentAt),
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
        };
        this.appendMessage(wMsg);
        if (this.snapshot.phase === 'collapsed') {
          this.patch({ hasUnread: true });
        }
      });

    // Rep joined — transition to live chat
    this.signalR.agentJoined$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.patch({ phase: 'live', queuePosition: null, repName: event.agentName ?? 'Support Agent' });
        this.addBotMessage(`You are now connected with **${this.snapshot.repName}**. Feel free to ask your question!`);
      });

    // Session closed by rep or system
    this.signalR.sessionClosed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.patch({ phase: 'ended' });
        this.clearSession();
      });

    // Typing indicator from rep
    this.signalR.userTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.patch({ isRepTyping: event.isTyping });
        if (event.isTyping) {
          if (this.typingResetTimer) clearTimeout(this.typingResetTimer);
          this.typingResetTimer = setTimeout(() => this.patch({ isRepTyping: false }), 4000);
        }
      });

    // Queue position refreshed — re-fetch session for updated position
    this.signalR.queueUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const { sessionId: sid } = this.snapshot;
        if (sid && this.snapshot.phase === 'waiting') {
          this.chatApi.getSession(sid).subscribe({
            next: (session) => {
              this.patch({ queuePosition: session.queuePosition });
            },
            error: () => { /* silent */ },
          });
        }
      });
  }

  // ── Bot Logic ─────────────────────────────────────────────────────────────

  private getBotResponse(input: string): string {
    const text = input.toLowerCase();

    if (HUMAN_INTENT_RE.test(text)) return '__HUMAN_INTENT__';
    if (this.awaitingConfirm && CONFIRM_RE.test(text)) return '__HUMAN_INTENT__';

    if (/\b(hour|available|open|schedule|when|time)\b/.test(text)) {
      return "Our support team is available **Monday–Friday, 8am–6pm EST**. I can also connect you with an agent right now if they're available!";
    }
    if (/\b(price|pricing|cost|plan|subscription|fee|charge)\b/.test(text)) {
      this.awaitingConfirm = true;
      return "For pricing and plan details, one of our account specialists would be the best resource. Would you like me to connect you with a representative?";
    }
    if (/\b(invoice|bill|billing|payment|refund|transaction)\b/.test(text)) {
      this.awaitingConfirm = true;
      return "For billing questions, our team can assist you right away. Would you like to speak with a billing representative?";
    }
    if (/\b(job|estimate|quote|work order|service request)\b/.test(text)) {
      return "Job and estimate management is handled through your organization's admin portal. I can answer general JobFlow questions or connect you with our support team. Type **representative** anytime!";
    }
    if (/\b(account|login|password|access|sign.?in|locked out)\b/.test(text)) {
      this.awaitingConfirm = true;
      return "For account or login issues, our technical support team can help directly. Would you like to connect with a support agent?";
    }
    if (/\b(hi|hello|hey|howdy|good morning|good afternoon|good evening)\b/.test(text)) {
      return "Hello! 😊 How can I assist you today?";
    }
    if (/\b(thank|thanks|thank you|thx)\b/.test(text)) {
      return "You're welcome! Is there anything else I can help with?";
    }
    if (/\b(bye|goodbye|see you|done|finished)\b/.test(text)) {
      return "Goodbye! Feel free to reach out anytime. Have a great day! 👋";
    }
    if (/\b(jobflow|job flow|platform|app|software|system)\b/.test(text)) {
      return "JobFlow is an all-in-one platform for trade businesses — managing jobs, estimates, invoices, client portals, and more. Anything specific you'd like to know?";
    }

    this.awaitingConfirm = true;
    return "I want to make sure you get the best help possible! I can answer general questions, or connect you with a live agent who can assist further. Type **representative** anytime to speak with someone. 😊";
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private addBotMessage(content: string): void {
    this.appendMessage({
      id: crypto.randomUUID(),
      content,
      sender: 'bot',
      senderName: 'JobFlow Bot',
      timestamp: new Date(),
    });
  }

  private addUserMessage(content: string): void {
    this.appendMessage({
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      senderName: this.snapshot.userInfo?.name ?? 'You',
      timestamp: new Date(),
    });
  }

  private appendMessage(msg: ChatWidgetMessage): void {
    this.patch({ messages: [...this.snapshot.messages, msg] });
  }

  private patch(partial: Partial<ChatWidgetState>): void {
    this.stateSubject.next({ ...this.snapshot, ...partial });
  }

  private resetWidget(): void {
    this.stateSubject.next({ ...this.initial });
  }

  // ── Session Storage ───────────────────────────────────────────────────────

  private restoreSession(): void {
    const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const userRaw = sessionStorage.getItem(USER_INFO_KEY);
    if (!sessionId || !userRaw) return;

    try {
      const userInfo = JSON.parse(userRaw) as ChatWidgetUserInfo;
      this.patch({ sessionId, userInfo, phase: 'waiting' });

      this.chatApi.getSession(sessionId).subscribe({
        next: (session) => {
          if (session.status === 'Active') {
            this.patch({ phase: 'live', repName: session.assignedRepName ?? 'Support Agent', queuePosition: null });
            this.connectSignalR(sessionId);
          } else if (session.status === 'Queued') {
            this.patch({ phase: 'waiting', queuePosition: session.queuePosition });
            this.connectSignalR(sessionId);
          } else {
            this.clearSession();
            this.patch({ phase: 'collapsed' });
          }
        },
        error: () => {
          this.clearSession();
          this.patch({ phase: 'collapsed' });
        },
      });
    } catch {
      this.clearSession();
    }
  }

  private saveSession(sessionId: string): void {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  private clearSession(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private saveUserInfo(info: ChatWidgetUserInfo): void {
    sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
  }

  private loadUserInfo(): ChatWidgetUserInfo | null {
    const raw = sessionStorage.getItem(USER_INFO_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as ChatWidgetUserInfo; } catch { return null; }
  }
}
