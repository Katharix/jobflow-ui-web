import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  EstimateStatus,
  EstimateStatusLabels,
} from '../../../admin/estimates/models/estimate';
import { ClientHubEstimate } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

@Component({
  selector: 'app-client-hub-estimates',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-hub-estimates.component.html',
  styleUrl: './client-hub-estimates.component.scss',
})
export class ClientHubEstimatesComponent implements OnInit {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);

  isLoading = true;
  error: string | null = null;
  items: ClientHubEstimate[] = [];

  ngOnInit(): void {
    this.load();
  }

  statusLabel(status: ClientHubEstimate['status']): string {
    const resolved = this.resolveStatus(status);
    return resolved !== null ? EstimateStatusLabels[resolved] : 'Unknown';
  }

  statusClass(status: ClientHubEstimate['status']): string {
    const resolved = this.resolveStatus(status);

    switch (resolved) {
      case EstimateStatus.Accepted:
        return 'is-accepted';
      case EstimateStatus.Declined:
        return 'is-declined';
      case EstimateStatus.Sent:
        return 'is-sent';
      case EstimateStatus.Expired:
        return 'is-expired';
      default:
        return 'is-draft';
    }
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value ?? 0);
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;

    this.clientHubService.getEstimates().subscribe({
      next: (items) => {
        this.items = [...(items ?? [])].sort((left, right) => {
          const leftDate = new Date(left.estimateDate ?? left.createdAt ?? 0).getTime();
          const rightDate = new Date(right.estimateDate ?? right.createdAt ?? 0).getTime();
          return rightDate - leftDate;
        });
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/estimates');
          return;
        }

        this.error = 'Unable to load your estimates at this time.';
      },
    });
  }

  private resolveStatus(status: ClientHubEstimate['status']): EstimateStatus | null {
    if (typeof status === 'number') {
      return status as EstimateStatus;
    }

    const asNumber = Number(status);
    if (!Number.isNaN(asNumber)) {
      return asNumber as EstimateStatus;
    }

    const normalized = String(status ?? '').trim().toLowerCase();
    const entry = Object.entries(EstimateStatusLabels).find(
      ([, label]) => label.toLowerCase() === normalized,
    );

    return entry ? (Number(entry[0]) as EstimateStatus) : null;
  }
}
