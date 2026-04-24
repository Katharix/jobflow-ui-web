import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RepChatPanelService } from '../../services/rep-chat-panel.service';

@Component({
  selector: 'app-rep-chat-panel',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule],
  templateUrl: './rep-chat-panel.component.html',
  styleUrl: './rep-chat-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  protected readonly panelService = inject(RepChatPanelService);
  private readonly auth = inject(Auth);

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  protected messageText = '';
  protected shouldScrollToBottom = false;

  private typingDebounce: ReturnType<typeof setTimeout> | null = null;
  private isTyping = false;
  private readonly destroy$ = new Subject<void>();

  protected get repName(): string {
    const user = this.auth.currentUser;
    return user?.displayName ?? user?.email?.split('@')[0] ?? 'Support Agent';
  }

  ngOnInit(): void {
    this.panelService.connect();
    this.panelService.state$.pipe(takeUntil(this.destroy$)).subscribe(() => {
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
    this.panelService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Panel visibility ──────────────────────────────────────────────────────

  openPanel(): void {
    this.panelService.openPanel();
  }

  closePanel(): void {
    this.panelService.closePanel();
  }

  // ── Queue accept/decline ──────────────────────────────────────────────────

  acceptCustomer(): void {
    this.panelService.acceptCustomer();
  }

  declineCustomer(): void {
    this.panelService.declineCustomer();
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  sendMessage(): void {
    if (!this.messageText.trim()) return;
    this.panelService.sendMessage(this.messageText, this.repName);
    this.messageText = '';
    this.stopTyping();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInputChange(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.panelService.notifyTyping(true);
    }
    if (this.typingDebounce) clearTimeout(this.typingDebounce);
    this.typingDebounce = setTimeout(() => this.stopTyping(), 2000);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.panelService.sendFile(file, this.repName);
    }
    input.value = '';
  }

  endSession(): void {
    this.panelService.endSession();
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  protected formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected formatWait(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.ceil(seconds / 60)} min`;
  }

  private stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.panelService.notifyTyping(false);
    }
    if (this.typingDebounce) {
      clearTimeout(this.typingDebounce);
      this.typingDebounce = null;
    }
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
