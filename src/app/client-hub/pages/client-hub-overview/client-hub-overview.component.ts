
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, throwError, timeout } from 'rxjs';
import { ClientHubProfile } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

@Component({
  selector: 'app-client-hub-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-hub-overview.component.html',
  styleUrl: './client-hub-overview.component.scss',
})
export class ClientHubOverviewComponent implements OnInit {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly requestTimeoutMs = 15000;

  isLoading = true;
  error: string | null = null;

  profile: ClientHubProfile | null = null;
  estimateCount = 0;
  invoiceCount = 0;
  outstandingBalance = 0;

  ngOnInit(): void {
    this.load();
  }

  get displayName(): string {
    const first = this.profile?.firstName ?? '';
    const last = this.profile?.lastName ?? '';
    const fullName = `${first} ${last}`.trim();
    return fullName || this.profile?.emailAddress || 'Client';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value ?? 0);
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      profile: this.clientHubService.getMe().pipe(
        timeout(this.requestTimeoutMs),
      ),
      estimates: this.clientHubService.getEstimates().pipe(
        timeout(this.requestTimeoutMs),
        catchError((error: unknown) => {
          if (this.isAuthError(error)) return throwError(() => error);
          return of([]);
        }),
      ),
      invoices: this.clientHubService.getInvoices().pipe(
        timeout(this.requestTimeoutMs),
        catchError((error: unknown) => {
          if (this.isAuthError(error)) return throwError(() => error);
          return of([]);
        }),
      ),
    }).subscribe({
      next: ({ profile, estimates, invoices }) => {
        this.profile = profile;
        this.estimateCount = estimates?.length ?? 0;
        this.invoiceCount = invoices?.length ?? 0;
        this.outstandingBalance = (invoices ?? []).reduce(
          (sum, invoice) => sum + Number(invoice.balanceDue ?? 0),
          0,
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        if (this.isAuthError(error)) {
          this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/overview');
          return;
        }

        this.error = 'Unable to load your client portal data at the moment.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private isAuthError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse
      && (error.status === 401 || error.status === 403);
  }
}
