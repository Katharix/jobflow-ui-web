
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../common/toast/toast.service';
import { ClientHubMagicLinkOrganizationClient } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';

@Component({
  selector: 'app-client-hub-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-hub-auth.component.html',
  styleUrl: './client-hub-auth.component.scss',
})
export class ClientHubAuthComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(ClientHubAuthService);
  private readonly toast = inject(ToastService);
  private readonly sendLinkErrorMessage = 'We could not send a magic link right now. Please try again.';
  private readonly invalidLinkErrorMessage = 'This magic link is invalid or expired. Please request a new link.';
  private readonly redeemErrorMessage =
    'We could not complete sign-in right now. Please request a new magic link.';
  private readonly selectOrganizationMessage =
    'We found this email in multiple client portals. Choose one and send the link again.';

  returnUrl = '/client-hub';
  emailAddress = '';
  isSubmitting = false;
  isConsumingToken = false;
  sentTo: string | null = null;
  error: string | null = null;
  attemptedSubmit = false;
  requiresOrganizationSelection = false;
  organizationCandidates: ClientHubMagicLinkOrganizationClient[] = [];
  selectedOrganizationClientId: string | null = null;

  ngOnInit(): void {
    this.returnUrl = this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

    const routeToken = this.route.snapshot.paramMap.get('token');
    const token =
      routeToken ??
      this.route.snapshot.queryParamMap.get('token') ??
      this.route.snapshot.queryParamMap.get('jwt') ??
      this.route.snapshot.queryParamMap.get('accessToken');

    if (token) {
      if (this.authService.isLikelyJwt(token)) {
        this.completeSignIn(token);
      } else {
        this.consumeToken(token);
      }
      return;
    }

    if (this.authService.hasToken()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  sendMagicLink(form: NgForm): void {
    this.attemptedSubmit = true;

    if (form.invalid || this.isSubmitting) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.emailAddress.trim()) {
      return;
    }

    this.error = null;
    this.isSubmitting = true;
    this.clearOrganizationSelection();

    this.authService.requestMagicLink(this.emailAddress.trim(), null).subscribe({
      next: (response) => {
        const candidates = response.clients ?? [];
        if (response.requiresOrganizationSelection && candidates.length > 1) {
          this.requiresOrganizationSelection = true;
          this.organizationCandidates = candidates;
          this.selectedOrganizationClientId = candidates[0].id;
          this.isSubmitting = false;
          this.sentTo = null;
          this.error = null;
          this.toast.info(this.selectOrganizationMessage);
          return;
        }

        this.attemptedSubmit = false;
        this.isSubmitting = false;
        this.sentTo = this.emailAddress.trim();
        this.toast.success('Magic link sent. Check your email to continue.');
      },
      error: () => {
        this.isSubmitting = false;
        this.error = this.sendLinkErrorMessage;
        this.toast.error(this.error);
      },
    });
  }

  sendMagicLinkForSelection(): void {
    if (
      this.isSubmitting ||
      !this.emailAddress.trim() ||
      !this.requiresOrganizationSelection ||
      !this.selectedOrganizationClientId
    ) {
      return;
    }

    this.error = null;
    this.isSubmitting = true;

    this.authService
      .requestMagicLink(this.emailAddress.trim(), this.selectedOrganizationClientId)
      .subscribe({
        next: (response) => {
          const candidates = response.clients ?? [];
          if (response.requiresOrganizationSelection && candidates.length > 1) {
            this.organizationCandidates = candidates;
            this.selectedOrganizationClientId = candidates[0].id;
            this.isSubmitting = false;
            return;
          }

          this.attemptedSubmit = false;
          this.isSubmitting = false;
          this.sentTo = this.emailAddress.trim();
          this.clearOrganizationSelection();
          this.toast.success('Magic link sent. Check your email to continue.');
        },
        error: () => {
          this.isSubmitting = false;
          this.error = this.sendLinkErrorMessage;
          this.toast.error(this.error);
        },
      });
  }

  onEmailChanged(): void {
    this.sentTo = null;
    this.error = null;
    this.clearOrganizationSelection();
  }

  candidateLabel(candidate: ClientHubMagicLinkOrganizationClient): string {
    const firstName = candidate.firstName?.trim() ?? '';
    const lastName = candidate.lastName?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || candidate.emailAddress?.trim() || 'Client record';
  }

  candidateOrganizationLabel(candidate: ClientHubMagicLinkOrganizationClient): string {
    const organizationName = candidate.organizationName?.trim() ?? '';
    if (organizationName) return organizationName;

    const value = candidate.organizationId?.trim() ?? '';
    if (!value) return 'Organization';

    return `Organization ${value.slice(0, 8)}...`;
  }

  private consumeToken(token: string): void {
    this.error = null;
    this.isConsumingToken = true;

    this.authService.redeemMagicLink(token).subscribe({
      next: (jwt) => this.completeSignIn(jwt),
      error: (err: unknown) => {
        this.isConsumingToken = false;
        this.stripTokenFromUrl();

        if (err instanceof HttpErrorResponse && [400, 401, 404, 410].includes(err.status)) {
          this.error = this.invalidLinkErrorMessage;
          return;
        }

        this.error = this.redeemErrorMessage;
      },
    });
  }

  private stripTokenFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('jwt');
    url.searchParams.delete('accessToken');
    window.history.replaceState({}, '', url.pathname + url.search);
  }

  private completeSignIn(token: string): void {
    this.authService.setToken(token);

    this.router.navigateByUrl(this.returnUrl).finally(() => {
      this.isConsumingToken = false;
    });
  }

  private safeReturnUrl(value: string | null): string {
    if (!value || !value.startsWith('/client-hub')) {
      return '/client-hub';
    }

    return value;
  }

  private clearOrganizationSelection(): void {
    this.requiresOrganizationSelection = false;
    this.organizationCandidates = [];
    this.selectedOrganizationClientId = null;
  }
}
