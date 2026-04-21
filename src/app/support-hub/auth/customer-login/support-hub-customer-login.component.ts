import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupportHubChatApiService } from '../../services/support-hub-chat-api.service';

@Component({
  selector: 'app-support-hub-customer-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-hub-customer-login.component.html',
  styleUrl: './support-hub-customer-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubCustomerLoginComponent {
  private chatApi = inject(SupportHubChatApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  name = '';
  email = '';
  accessCode = '';
  isLoading = false;
  submitted = false;
  error = '';

  onJoinQueue(event: Event): void {
    event.preventDefault();
    this.submitted = true;
    if (!this.name || !this.email) return;

    this.isLoading = true;
    this.error = '';

    this.chatApi.joinQueue({
      customerName: this.name,
      customerEmail: this.email,
      accessCode: this.accessCode || undefined
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        sessionStorage.setItem('support-hub-customer-name', this.name);
        sessionStorage.setItem('support-hub-session-id', res.sessionId);
        this.router.navigate(['/support-hub/queue-status', res.sessionId]);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || 'Failed to join support queue. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
