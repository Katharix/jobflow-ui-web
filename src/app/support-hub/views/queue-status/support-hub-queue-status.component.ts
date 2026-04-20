import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportHubSignalRService } from '../../services/support-hub-signalr.service';

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

  sessionId = '';
  queuePosition = 0;
  estimatedMinutes = 0;
  isLoading = false;
  agentJoined = false;
  agentName = '';

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.initSignalR();
  }

  private async initSignalR(): Promise<void> {
    await this.signalR.startConnection();
    await this.signalR.joinSession(this.sessionId);

    this.signalR.agentJoined$.subscribe(({ agentName }) => {
      this.agentJoined = true;
      this.agentName = agentName;
      setTimeout(() => this.router.navigate(['/support-hub/chat', this.sessionId]), 2000);
    });
  }

  ngOnDestroy(): void {
    this.signalR.leaveSession(this.sessionId);
  }
}
