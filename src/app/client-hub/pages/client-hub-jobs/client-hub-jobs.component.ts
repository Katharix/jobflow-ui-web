
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ClientHubJobSummary } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';
import { JobLifecycleStatus, JobLifecycleStatusLabels } from '../../../admin/jobs/models/job';

@Component({
  selector: 'app-client-hub-jobs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-hub-jobs.component.html',
  styleUrl: './client-hub-jobs.component.scss',
})
export class ClientHubJobsComponent implements OnInit {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly requestTimeoutMs = 15000;

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
      case JobLifecycleStatus.Booked:
        return 'is-booked';
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

    this.clientHubService.getJobs().pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: (jobs) => {
        this.jobs = jobs ?? [];
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        if (this.isAuthError(error)) {
          this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/jobs');
          return;
        }

        this.error = 'Unable to load your job updates right now.';
      },
    });
  }

  private isAuthError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse
      && (error.status === 401 || error.status === 403);
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
