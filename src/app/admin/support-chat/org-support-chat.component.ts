import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { SupportHubChatApiService } from '../../support-hub/services/support-hub-chat-api.service';

@Component({
  selector: 'app-org-support-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-support-chat.component.html',
  styleUrl: './org-support-chat.component.scss',
})
export class OrgSupportChatComponent implements OnInit {
  private authService = inject(AuthService);
  private chatApi = inject(SupportHubChatApiService);
  private router = inject(Router);

  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.startChat();
  }

  startChat(): void {
    this.isLoading = true;
    this.error = '';

    const user = this.authService.currentUser;
    const customerName = user?.displayName ?? user?.email ?? '';
    const customerEmail = user?.email ?? '';

    this.chatApi.joinQueue({ customerName, customerEmail }).subscribe({
      next: (res) => {
        this.isLoading = false;
        sessionStorage.setItem('support-hub-customer-name', customerName || 'You');
        sessionStorage.setItem('support-hub-session-id', res.sessionId);
        this.router.navigate(['/admin/support-chat/queue-status', res.sessionId]);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.detail ?? err?.error?.message ?? 'Failed to connect to support. Please try again.';
      },
    });
  }
}
