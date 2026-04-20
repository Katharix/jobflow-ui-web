import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupportHubChatApiService } from '../../services/support-hub-chat-api.service';
import { SupportHubSignalRService } from '../../services/support-hub-signalr.service';
import { QueueCardComponent, QueueCustomer } from '../../components/queue-card/queue-card.component';

@Component({
  selector: 'app-support-hub-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, QueueCardComponent],
  templateUrl: './support-hub-queue.component.html',
  styleUrl: './support-hub-queue.component.scss',
})
export class SupportHubQueueComponent implements OnInit, OnDestroy {
  private chatApi = inject(SupportHubChatApiService);
  private signalR = inject(SupportHubSignalRService);
  private router = inject(Router);

  isLoading = false;
  queuedCustomers: QueueCustomer[] = [];
  avgWaitMinutes = 0;

  ngOnInit(): void {
    this.loadQueue();
    this.initSignalR();
  }

  private async initSignalR(): Promise<void> {
    await this.signalR.startConnection();
    await this.signalR.joinRepGroup();
    this.signalR.queueUpdated$.subscribe(() => this.loadQueue());
  }

  private loadQueue(): void {
    this.isLoading = true;
    this.chatApi.getQueue().subscribe({
      next: (items) => {
        this.queuedCustomers = items.map(item => ({
          id: item.sessionId,
          name: item.customerName,
          organizationName: item.customerEmail,
          waitMinutes: Math.ceil(item.estimatedWaitSeconds / 60),
          position: item.queuePosition,
          avatarInitials: this.getInitials(item.customerName),
          avatarColor: undefined
        }));
        this.avgWaitMinutes = this.queuedCustomers.length > 0
          ? Math.round(this.queuedCustomers.reduce((sum, c) => sum + c.waitMinutes, 0) / this.queuedCustomers.length)
          : 0;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onPickUp(customerId: string): void {
    this.chatApi.pickCustomer(customerId).subscribe(() => {
      this.router.navigate(['/support-hub/live-chat', customerId]);
    });
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnDestroy(): void {
    this.signalR.disconnect();
  }
}
