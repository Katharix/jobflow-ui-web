import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatWidgetService } from './chat-widget.service';
import { ChatWidgetUserInfo } from './chat-widget.models';
import { JfMarkdownInlinePipe } from './jf-markdown-inline.pipe';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, JfMarkdownInlinePipe],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  protected readonly service = inject(ChatWidgetService);

  /** Optional: pre-fill the validation form with known user data */
  @Input() prefillName = '';
  @Input() prefillEmail = '';
  @Input() prefillPhone = '';

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  protected messageText = '';
  protected shouldScrollToBottom = false;

  protected validationForm: ChatWidgetUserInfo = { name: '', email: '', phone: '' };

  private typingDebounce: ReturnType<typeof setTimeout> | null = null;
  private isTyping = false;
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Pre-fill the validation form
    if (this.prefillName) this.validationForm.name = this.prefillName;
    if (this.prefillEmail) this.validationForm.email = this.prefillEmail;
    if (this.prefillPhone) this.validationForm.phone = this.prefillPhone;

    // Pre-fill from saved user info if available
    const saved = this.service.snapshot.userInfo;
    if (saved) {
      if (!this.validationForm.name) this.validationForm.name = saved.name;
      if (!this.validationForm.email) this.validationForm.email = saved.email;
      if (!this.validationForm.phone) this.validationForm.phone = saved.phone;
    }

    // Trigger scroll whenever state changes
    this.service.state$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.shouldScrollToBottom = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── FAB & Panel ───────────────────────────────────────────────────────────

  onFabClick(): void {
    this.service.openWidget();
  }

  collapseWidget(): void {
    this.service.collapseWidget();
  }

  closeChat(): void {
    this.service.closeWidget();
  }

  // ── Bot Phase ─────────────────────────────────────────────────────────────

  sendBotMessage(): void {
    if (!this.messageText.trim()) return;
    this.service.sendBotMessage(this.messageText);
    this.messageText = '';
  }

  onBotKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendBotMessage();
    }
  }

  // ── Validate Phase ───────────────────────────────────────────────────────

  submitValidation(form: NgForm): void {
    if (form.invalid) return;
    this.service.submitValidation({ ...this.validationForm });
  }

  cancelValidation(): void {
    this.service.cancelValidation();
  }

  // ── Live Phase ────────────────────────────────────────────────────────────

  sendLiveMessage(): void {
    if (!this.messageText.trim()) return;
    this.service.sendMessage(this.messageText);
    this.messageText = '';
    this.stopTyping();
  }

  onLiveKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendLiveMessage();
    }
  }

  onInputChange(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.service.notifyTyping(true);
    }
    if (this.typingDebounce) clearTimeout(this.typingDebounce);
    this.typingDebounce = setTimeout(() => this.stopTyping(), 2000);
  }

  private stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.service.notifyTyping(false);
    }
    if (this.typingDebounce) {
      clearTimeout(this.typingDebounce);
      this.typingDebounce = null;
    }
  }

  // ── File Upload ───────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.service.sendFile(file);
    }
    input.value = ''; // reset so same file can be re-selected
  }

  // ── End Session ───────────────────────────────────────────────────────────

  endSession(): void {
    this.service.endSession();
  }

  startNewChat(): void {
    this.service.startNewChat();
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  protected formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected formatWait(seconds: number | null): string {
    if (!seconds) return 'a few moments';
    if (seconds < 60) return `~${seconds}s`;
    return `~${Math.ceil(seconds / 60)} min`;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
