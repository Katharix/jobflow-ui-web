import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupportHubSignalRService } from '../../services/support-hub-signalr.service';
import { SupportHubChatApiService } from '../../services/support-hub-chat-api.service';

@Component({
  selector: 'app-support-hub-queue-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-hub-queue-status.component.html',
  styleUrl: './support-hub-queue-status.component.scss',
})
export class SupportHubQueueStatusComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private signalR = inject(SupportHubSignalRService);
  private chatApi = inject(SupportHubChatApiService);
  private destroy$ = new Subject<void>();

  sessionId = '';
  queuePosition = 0;
  estimatedMinutes = 0;
  isLoading = false;
  isConnecting = false;
  agentJoined = false;
  agentName = '';

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.refreshPosition();
    this.initSignalR();
  }

  private refreshPosition(): void {
    this.chatApi.getSession(this.sessionId).subscribe(session => {
      this.queuePosition = session.queuePosition;
      this.estimatedMinutes = Math.ceil(session.estimatedWaitSeconds / 60);
    });
  }

  private async initSignalR(): Promise<void> {
    this.isConnecting = true;
    try {
      await this.signalR.startConnection();
      await this.signalR.joinSession(this.sessionId);

      this.signalR.agentJoined$.pipe(takeUntil(this.destroy$)).subscribe(({ agentName }) => {
        this.agentJoined = true;
        this.agentName = agentName;
        const storedSessionId = sessionStorage.getItem('support-hub-session-id');
        const isOrgFlow = storedSessionId === this.sessionId;
        const chatPath = isOrgFlow
          ? ['/admin/support-chat/chat', this.sessionId]
          : ['/support-hub/chat', this.sessionId];
        setTimeout(() => this.router.navigate(chatPath, { replaceUrl: true }), 2000);
      });

      this.signalR.queueUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.refreshPosition();
      });
    } catch (err) {
      console.error('SignalR connection failed:', err);
    } finally {
      this.isConnecting = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalR.leaveSession(this.sessionId);
  }
}
