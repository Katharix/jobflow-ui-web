import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientHubJobSummary } from '../../models/client-hub.models';
import { ClientHubService } from '../../services/client-hub.service';
import { JobLifecycleStatus, JobLifecycleStatusLabels } from '../../../admin/jobs/models/job';

@Component({
  selector: 'app-client-hub-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-hub-jobs.component.html',
  styleUrl: './client-hub-jobs.component.scss',
})
export class ClientHubJobsComponent implements OnInit {
  private readonly clientHubService = inject(ClientHubService);

  isLoading = true;
  error: string | null = null;
  jobs: ClientHubJobSummary[] = [];

  ngOnInit(): void {
    this.loadJobs();
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  statusLabel(status: ClientHubJobSummary['status']): string {
    const resolved = this.resolveStatus(status);
    return resolved !== null ? JobLifecycleStatusLabels[resolved] : 'Status update';
  }

  statusClass(status: ClientHubJobSummary['status']): string {
    const resolved = this.resolveStatus(status);
    switch (resolved) {
      case JobLifecycleStatus.Completed:
        return 'is-completed';
      case JobLifecycleStatus.InProgress:
        return 'is-inprogress';
      case JobLifecycleStatus.Approved:
        return 'is-approved';
      case JobLifecycleStatus.Cancelled:
      case JobLifecycleStatus.Failed:
        return 'is-danger';
      default:
        return 'is-draft';
    }
  }

  private loadJobs(): void {
    this.isLoading = true;
    this.error = null;

    this.clientHubService.getJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Unable to load your job updates right now.';
      },
    });
  }

  private resolveStatus(value: ClientHubJobSummary['status']): JobLifecycleStatus | null {
    if (typeof value === 'number') {
      return value as JobLifecycleStatus;
    }

    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) {
      return asNumber as JobLifecycleStatus;
    }

    const normalized = String(value ?? '').trim().toLowerCase();
    const entry = Object.entries(JobLifecycleStatusLabels).find(
      ([, label]) => label.toLowerCase() === normalized,
    );

    return entry ? (Number(entry[0]) as JobLifecycleStatus) : null;
  }
}
