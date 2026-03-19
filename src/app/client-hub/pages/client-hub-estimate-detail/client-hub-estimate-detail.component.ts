import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EstimateStatus,
  EstimateStatusLabels,
} from '../../../admin/estimates/models/estimate';
import { ModalService } from '../../../common/modal/modal.service';
import { EstimateRevisionFormComponent } from '../../components/estimate-revision-form/estimate-revision-form.component';
import { EstimateRevisionHistoryComponent } from '../../components/estimate-revision-history/estimate-revision-history.component';
import { ClientHubEstimate } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

@Component({
  selector: 'app-client-hub-estimate-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, EstimateRevisionHistoryComponent],
  templateUrl: './client-hub-estimate-detail.component.html',
  styleUrl: './client-hub-estimate-detail.component.scss',
})
export class ClientHubEstimateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly modal = inject(ModalService);

  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  actionError: string | null = null;
  actionSuccess: string | null = null;
  estimate: ClientHubEstimate | null = null;
  revisionRefreshToken = 0;

  ngOnInit(): void {
    this.loadEstimate();
  }

  get statusLabel(): string {
    if (!this.estimate) return 'Unknown';
    const resolved = this.resolveStatus(this.estimate.status);
    return resolved !== null ? EstimateStatusLabels[resolved] : 'Unknown';
  }

  get canRespond(): boolean {
    if (!this.estimate || this.isSubmitting) return false;
    return this.resolveStatus(this.estimate.status) === EstimateStatus.Sent;
  }

  get subtotal(): number {
    if (!this.estimate) return 0;

    if (typeof this.estimate.subtotal === 'number') {
      return this.estimate.subtotal;
    }

    return (this.estimate.lineItems ?? []).reduce((sum, item) => {
      const lineTotal = this.lineItemTotal(item);
      return sum + lineTotal;
    }, 0);
  }

  respondToEstimate(action: 'accept' | 'decline'): void {
    if (!this.estimate?.id || !this.canRespond) return;

    this.isSubmitting = true;
    this.actionError = null;
    this.actionSuccess = null;

    const request =
      action === 'accept'
        ? this.clientHubService.acceptEstimate(this.estimate.id)
        : this.clientHubService.declineEstimate(this.estimate.id);

    request.subscribe({
      next: () => {
        if (!this.estimate) return;

        this.estimate = {
          ...this.estimate,
          status: action === 'accept' ? EstimateStatus.Accepted : EstimateStatus.Declined,
        };

        this.actionSuccess =
          action === 'accept'
            ? 'Estimate accepted. Your organization has been notified.'
            : 'Estimate declined. Your organization has been notified.';
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
          return;
        }

        this.actionError =
          action === 'accept'
            ? 'Unable to accept this estimate right now. Please try again.'
            : 'Unable to decline this estimate right now. Please try again.';
      },
    });
  }

  openRevisionModal(): void {
    const estimateId = this.estimate?.id;
    if (!estimateId) return;

    const ref = this.modal.open(EstimateRevisionFormComponent, {
      data: {
        estimateId,
        estimateNumber: this.estimate?.estimateNumber ?? null,
      },
      panelClass: 'modal-md',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.revisionRefreshToken += 1;
      this.loadEstimate();
    });
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

  lineItemTotal(item: { lineTotal?: number; quantity?: number; unitPrice?: number }): number {
    if (typeof item.lineTotal === 'number') return item.lineTotal;
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  statusClass(status: ClientHubEstimate['status']): string {
    const resolved = this.resolveStatus(status);

    switch (resolved) {
      case EstimateStatus.Accepted:
        return 'is-accepted';
      case EstimateStatus.Declined:
        return 'is-declined';
      case EstimateStatus.Cancelled:
        return 'is-cancelled';
      case EstimateStatus.Sent:
        return 'is-sent';
      case EstimateStatus.RevisionRequested:
        return 'is-revision-requested';
      case EstimateStatus.Expired:
        return 'is-expired';
      default:
        return 'is-draft';
    }
  }

  private loadEstimate(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid estimate link.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.clientHubService.getEstimateById(id).subscribe({
      next: (estimate) => {
        this.estimate = estimate;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
          return;
        }

        this.error = 'Unable to load this estimate right now.';
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
