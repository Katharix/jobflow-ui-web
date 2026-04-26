import { Component, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { SetupCompanionApiService } from '../../services/shared/setup-companion-api.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { ChatWidgetService } from '../chat-widget/chat-widget.service';
import { ChatWidgetState, ChatWidgetUserInfo } from '../chat-widget/chat-widget.models';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const ESCALATION_RE =
  /\b(representative|rep|human|person|agent|someone|staff|support agent|real person|speak to|talk to|connect me|live help|live chat|live support)\b/i;

@Component({
  selector: 'app-setup-companion',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './setup-companion.component.html',
  styleUrl: './setup-companion.component.scss',
})
export class SetupCompanionComponent implements OnInit {
  private apiService = inject(SetupCompanionApiService);
  private orgContext = inject(OrganizationContextService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly chatWidget = inject(ChatWidgetService);

  @ViewChild('bodyRef') bodyRef?: ElementRef<HTMLElement>;

  isOpen = signal(false);
  visible = signal(false);
  messages = signal<ChatMessage[]>([]);
  inputText = '';
  isLoading = signal(false);
  rateLimited = signal(false);

  /** Live support form state */
  validationForm: ChatWidgetUserInfo = { name: '', email: '', phone: '' };
  liveMessageText = '';
  private isTyping = false;
  private typingDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly liveState = toSignal<ChatWidgetState>(this.chatWidget.state$);

  get livePhase() { return this.liveState()?.phase ?? 'collapsed'; }
  get isLiveMode(): boolean {
    const p = this.livePhase;
    return p === 'validate' || p === 'waiting' || p === 'live' || p === 'ended';
  }

  private sessionId = crypto.randomUUID();

  ngOnInit(): void {
    this.orgContext.org$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(org => {
        this.visible.set(!!org?.id);
        // Pre-fill validation form from saved user info
        const saved = this.chatWidget.snapshot.userInfo;
        if (saved) {
          if (!this.validationForm.name) this.validationForm.name = saved.name;
          if (!this.validationForm.email) this.validationForm.email = saved.email;
          if (!this.validationForm.phone) this.validationForm.phone = saved.phone;
        }
      });
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.messages().length === 0) {
      this.messages.set([{
        role: 'assistant',
        text: 'Hi, I\'m Flow — your JobFlow setup guide. What can I help you with today? You can also type "representative" to speak with a live support agent.'
      }]);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  backToAi(): void {
    this.chatWidget.collapseWidget();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    this.inputText = '';

    // Escalation keyword → hand off to live chat
    if (ESCALATION_RE.test(text)) {
      this.messages.update(m => [...m, { role: 'user', text }]);
      this.messages.update(m => [...m, {
        role: 'assistant',
        text: 'Sure! Let me connect you with a live support agent. I just need a few details first.'
      }]);
      this.scrollToBottom();
      setTimeout(() => this.chatWidget.escalateToValidate(), 600);
      return;
    }

    this.messages.update(m => [...m, { role: 'user', text }]);
    this.isLoading.set(true);
    this.rateLimited.set(false);
    this.scrollToBottom();

    this.apiService.ask({
      sessionId: this.sessionId,
      question: text,
      currentRoute: this.router.url,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.messages.update(m => [...m, { role: 'assistant', text: res.answer }]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 429) {
          this.rateLimited.set(true);
          this.messages.update(m => [...m, {
            role: 'assistant',
            text: 'You\'ve reached the hourly question limit. Please try again in a little while.'
          }]);
        } else {
          this.messages.update(m => [...m, {
            role: 'assistant',
            text: 'Something went wrong. Please try again.'
          }]);
        }
        this.scrollToBottom();
      }
    });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  // ── Live support passthrough ──────────────────────────────────────────────

  submitValidation(): void {
    if (!this.validationForm.name || !this.validationForm.email) return;
    this.chatWidget.submitValidation({ ...this.validationForm });
  }

  cancelValidation(): void {
    this.chatWidget.cancelValidation();
  }

  sendLiveMessage(): void {
    if (!this.liveMessageText.trim()) return;
    this.chatWidget.sendMessage(this.liveMessageText);
    this.liveMessageText = '';
    this.stopTyping();
  }

  onLiveKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendLiveMessage();
    }
  }

  onLiveInputChange(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatWidget.notifyTyping(true);
    }
    if (this.typingDebounce) clearTimeout(this.typingDebounce);
    this.typingDebounce = setTimeout(() => this.stopTyping(), 2000);
  }

  private stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.chatWidget.notifyTyping(false);
    }
    if (this.typingDebounce) {
      clearTimeout(this.typingDebounce);
      this.typingDebounce = null;
    }
  }

  endLiveSession(): void {
    this.chatWidget.endSession();
  }

  startNewChat(): void {
    this.chatWidget.startNewChat();
  }

  formatWait(seconds: number): string {
    if (seconds < 60) return `~${seconds}s`;
    return `~${Math.ceil(seconds / 60)} min`;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.bodyRef?.nativeElement) {
        this.bodyRef.nativeElement.scrollTop = this.bodyRef.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
