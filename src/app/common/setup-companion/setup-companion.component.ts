import { Component, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { SetupCompanionApiService } from '../../services/shared/setup-companion-api.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

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

  @ViewChild('bodyRef') bodyRef?: ElementRef<HTMLElement>;

  isOpen = signal(false);
  visible = signal(false);
  messages = signal<ChatMessage[]>([]);
  inputText = '';
  isLoading = signal(false);
  rateLimited = signal(false);

  private sessionId = crypto.randomUUID();

  ngOnInit(): void {
    this.orgContext.org$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(org => {
        this.visible.set(!!org?.id);
      });
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.messages().length === 0) {
      this.messages.set([{
        role: 'assistant',
        text: 'Hi, I\'m Flow — your JobFlow setup guide. What can I help you with today?'
      }]);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    this.inputText = '';
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

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.bodyRef?.nativeElement) {
        this.bodyRef.nativeElement.scrollTop = this.bodyRef.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
