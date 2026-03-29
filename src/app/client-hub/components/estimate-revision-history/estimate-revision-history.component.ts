
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../common/toast/toast.service';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { EstimateRevisionApi } from '../../services/estimate-revision-api';
import { EstimateRevisionRequestDto } from '../../models/client-hub.models';

@Component({
  selector: 'app-estimate-revision-history',
  standalone: true,
  imports: [],
  templateUrl: './estimate-revision-history.component.html',
  styleUrl: './estimate-revision-history.component.scss',
})
export class EstimateRevisionHistoryComponent implements OnChanges {
  private readonly api = inject(EstimateRevisionApi);
  private readonly auth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) estimateId = '';
  @Input() refreshToken = 0;

  isLoading = false;
  error: string | null = null;
  items: EstimateRevisionRequestDto[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estimateId'] || changes['refreshToken']) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    if (!this.estimateId) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.api.getRevisionRequests(this.estimateId).subscribe({
      next: (items) => {
        this.items = [...items].sort((left, right) => {
          const leftDate = new Date(left.requestedAt ?? 0).getTime();
          const rightDate = new Date(right.requestedAt ?? 0).getTime();
          return rightDate - leftDate;
        });
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401 || error.status === 403) {
          this.auth.handleUnauthorized(this.router, `/client-hub/estimates/${this.estimateId}`);
          return;
        }

        if (error.status === 404) {
          this.error = 'Revision history is not available for this estimate.';
          return;
        }

        this.error = 'Unable to load revision history right now.';
      },
    });
  }

  downloadAttachment(revision: EstimateRevisionRequestDto, attachmentId: string, fileName: string): void {
    if (!this.estimateId || !revision?.id) {
      return;
    }

    this.api.downloadAttachment(this.estimateId, revision.id, attachmentId).subscribe({
      next: (blob) => this.triggerDownload(blob, fileName),
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.auth.handleUnauthorized(this.router, `/client-hub/estimates/${this.estimateId}`);
          return;
        }

        this.toast.error('Unable to download that attachment right now.');
      },
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  statusLabel(status?: string | null): string {
    if (!status) return 'Unknown';
    const normalized = status.replace(/([a-z])([A-Z])/g, '$1 $2');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  statusClass(status?: string | null): string {
    const normalized = (status ?? '').toLowerCase();
    if (normalized.includes('requested')) return 'is-requested';
    if (normalized.includes('review')) return 'is-review';
    if (normalized.includes('resolved')) return 'is-resolved';
    if (normalized.includes('rejected')) return 'is-rejected';
    if (normalized.includes('cancelled')) return 'is-cancelled';
    return 'is-unknown';
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName || 'attachment';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
