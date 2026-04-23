import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { environment } from '../../../environments/environment';
import {
  ClientHubMagicLinkOrganizationClient,
  ClientHubMagicLinkRequestResponse,
} from '../models/client-hub.models';

const SESSION_EXPIRY_KEY = 'jobflow.clientHub.sessionExpiry';

@Injectable({ providedIn: 'root' })
export class ClientHubAuthService {
  private readonly api = inject(BaseApiService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly authUrl = 'client-hub-auth';
  private readonly clientPortalRedeemUrl = 'client-portal/redeem';
  private readonly clientPortalLogoutUrl = 'client-portal/logout';

  requestMagicLink(
    emailAddress: string,
    organizationClientId?: string | null,
  ): Observable<ClientHubMagicLinkRequestResponse> {
    return this.api
      .post<unknown>(
        `${this.authUrl}/magic-link/request`,
        {
          emailAddress,
          organizationClientId: organizationClientId ?? null,
        }
      )
      .pipe(map((response) => this.normalizeMagicLinkRequestResponse(response)));
  }

  redeemMagicLink(token: string): Observable<string> {
    return this.http
      .post<unknown>(
        `${this.apiUrl}/${this.clientPortalRedeemUrl}`,
        { token },
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          const expiresAt = this.extractExpiresAt(response);
          if (!expiresAt) {
            throw new Error('No session expiry returned after redeeming the magic link.');
          }
          return expiresAt;
        }),
      );
  }

  markAuthenticated(expiresAt: string): void {
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiresAt);
  }

  hasToken(): boolean {
    const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiry) return false;

    const expiresAt = new Date(expiry).getTime();
    return expiresAt > Date.now();
  }

  handleUnauthorized(router: Router, returnUrl: string): void {
    this.clearToken();
    router.navigate(['/client-hub/auth'], {
      queryParams: { returnUrl },
    });
  }

  clearToken(): void {
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    this.http.post<unknown>(
      `${this.apiUrl}/${this.clientPortalLogoutUrl}`,
      {},
      { withCredentials: true }
    ).subscribe({
      error: () => { /* best effort — cookie will expire on its own */ }
    });
  }

  private extractExpiresAt(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const source = response as Record<string, unknown>;
    const candidates: Record<string, unknown>[] = [
      source,
      source['result'] as Record<string, unknown>,
      source['value'] as Record<string, unknown>,
    ].filter((c): c is Record<string, unknown> => !!c && typeof c === 'object');

    for (const candidate of candidates) {
      const raw = candidate['expiresAt'] ?? candidate['ExpiresAt'];
      if (typeof raw === 'string' && raw.length > 0) {
        return raw;
      }
    }

    return null;
  }

  private normalizeMagicLinkRequestResponse(response: unknown): ClientHubMagicLinkRequestResponse {
    if (!response || typeof response !== 'object') {
      return {};
    }

    const source = response as Record<string, unknown>;
    const rawRequires = source['requiresOrganizationSelection'] ?? source['RequiresOrganizationSelection'];
    const rawClients = source['clients'] ?? source['Clients'];

    return {
      requiresOrganizationSelection:
        typeof rawRequires === 'boolean' ? rawRequires : undefined,
      clients: Array.isArray(rawClients)
        ? rawClients.map((candidate) => this.normalizeOrganizationCandidate(candidate))
        : undefined,
    };
  }

  private normalizeOrganizationCandidate(value: unknown): ClientHubMagicLinkOrganizationClient {
    const source = (value ?? {}) as Record<string, unknown>;

    return {
      id: String(source['id'] ?? source['Id'] ?? ''),
      organizationId: String(source['organizationId'] ?? source['OrganizationId'] ?? ''),
      organizationName:
        this.toOptionalString(source['organizationName'] ?? source['OrganizationName']),
      firstName: this.toOptionalString(source['firstName'] ?? source['FirstName']),
      lastName: this.toOptionalString(source['lastName'] ?? source['LastName']),
      emailAddress: this.toOptionalString(source['emailAddress'] ?? source['EmailAddress']),
    };
  }

  private toOptionalString(value: unknown): string | null | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
