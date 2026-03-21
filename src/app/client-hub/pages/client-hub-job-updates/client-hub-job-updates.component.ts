
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ClientHubEstimate,
  ClientHubJobSummary,
  ClientHubTimelineAttachment,
  ClientHubTimelineItem,
} from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';
import { EstimateStatus, EstimateStatusLabels } from '../../../admin/estimates/models/estimate';
import { JobLifecycleStatus, JobLifecycleStatusLabels } from '../../../admin/jobs/models/job';

@Component({
  selector: 'app-client-hub-job-updates',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-hub-job-updates.component.html',
  styleUrl: './client-hub-job-updates.component.scss',
})
export class ClientHubJobUpdatesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly sanitizer = inject(DomSanitizer);

  isLoading = true;
  error: string | null = null;
  job: ClientHubJobSummary | null = null;
  timeline: ClientHubTimelineItem[] = [];
  pendingEstimates: ClientHubEstimate[] = [];
  private attachmentUrls = new Map<string, SafeUrl>();
  private attachmentObjectUrls: string[] = [];

  ngOnInit(): void {
    this.loadJobUpdates();
  }

  ngOnDestroy(): void {
    this.attachmentObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  jobStatusLabel(status: ClientHubJobSummary['status'] | undefined): string {
    if (status === undefined) return 'Status update';
    const resolved = this.resolveJobStatus(status);
    return resolved !== null ? JobLifecycleStatusLabels[resolved] : 'Status update';
  }

  estimateStatusLabel(status: ClientHubEstimate['status']): string {
    const resolved = this.resolveEstimateStatus(status);
    return resolved !== null ? EstimateStatusLabels[resolved] : 'Pending';
  }

  timelineClass(type: string): string {
    switch (type) {
      case 'invoice-paid':
        return 'timeline-item--success';
      case 'invoice-sent':
        return 'timeline-item--info';
      case 'photo':
        return 'timeline-item--photo';
      case 'note':
        return 'timeline-item--note';
      case 'status':
        return 'timeline-item--status';
      default:
        return 'timeline-item--default';
    }
  }

  private loadJobUpdates(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid job link.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    forkJoin({
      job: this.clientHubService.getJobById(id),
      timeline: this.clientHubService.getJobTimeline(id),
      estimates: this.clientHubService.getEstimates(),
    }).subscribe({
      next: ({ job, timeline, estimates }) => {
        this.job = job;
        this.timeline = timeline ?? [];
        this.pendingEstimates = (estimates ?? []).filter(
          (estimate) => this.resolveEstimateStatus(estimate.status) === EstimateStatus.Sent,
        );
        this.loadAttachmentPreviews(job.id, this.timeline);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401 || error.status === 403) {
          this.clientHubAuth.handleUnauthorized(this.router, this.router.url);
          return;
        }

        this.error = 'Unable to load updates right now.';
      },
    });
  }

  getAttachmentUrl(attachment: ClientHubTimelineAttachment): SafeUrl | null {
    return this.attachmentUrls.get(attachment.id) ?? null;
  }

  private loadAttachmentPreviews(jobId: string, timeline: ClientHubTimelineItem[]): void {
    this.attachmentUrls.clear();
    this.attachmentObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.attachmentObjectUrls = [];

    timeline.forEach((item) => {
      if (!item.updateId || !item.attachments?.length) {
        return;
      }

      item.attachments.forEach((attachment) => {
        this.clientHubService
          .getJobUpdateAttachment(jobId, item.updateId as string, attachment.id)
          .subscribe({
            next: (blob) => {
              const objectUrl = URL.createObjectURL(blob);
              this.attachmentObjectUrls.push(objectUrl);
              this.attachmentUrls.set(
                attachment.id,
                this.sanitizer.bypassSecurityTrustUrl(objectUrl),
              );
            },
          });
      });
    });
  }

  private resolveEstimateStatus(status: ClientHubEstimate['status']): EstimateStatus | null {
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

  private resolveJobStatus(status: ClientHubJobSummary['status']): JobLifecycleStatus | null {
    if (typeof status === 'number') {
      return status as JobLifecycleStatus;
    }

    const asNumber = Number(status);
    if (!Number.isNaN(asNumber)) {
      return asNumber as JobLifecycleStatus;
    }

    const normalized = String(status ?? '').trim().toLowerCase();
    const entry = Object.entries(JobLifecycleStatusLabels).find(
      ([, label]) => label.toLowerCase() === normalized,
    );

    return entry ? (Number(entry[0]) as JobLifecycleStatus) : null;
  }
}
