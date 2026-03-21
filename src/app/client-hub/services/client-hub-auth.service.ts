import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import {
  ClientHubMagicLinkOrganizationClient,
  ClientHubMagicLinkRequestResponse,
} from '../models/client-hub.models';

@Injectable({ providedIn: 'root' })
export class ClientHubAuthService {
  private readonly api = inject(BaseApiService);
  private readonly authUrl = 'client-hub-auth';
  private readonly clientPortalRedeemUrl = 'client-portal/redeem';
  private readonly tokenStorageKey = 'jobflow.clientHub.token';

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
        },
        false,
      )
      .pipe(map((response) => this.normalizeMagicLinkRequestResponse(response)));
  }

  redeemMagicLink(token: string): Observable<string> {
    return this.api
      .post<unknown>(
        this.clientPortalRedeemUrl,
        { token },
        false,
      )
      .pipe(
        map((response) => {
          const accessToken = this.extractAccessToken(response);
          if (!accessToken) {
            throw new Error('No access token was returned after redeeming the magic link.');
          }
          return accessToken;
        }),
      );
  }

  isLikelyJwt(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) return null;

    if (!this.isLikelyJwt(token)) {
      this.clearToken();
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearToken();
      return null;
    }

    return token;
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  handleUnauthorized(router: Router, returnUrl: string): void {
    this.clearToken();
    router.navigate(['/client-hub/auth'], {
      queryParams: { returnUrl },
    });
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  private isTokenExpired(token: string): boolean {
    if (!this.isLikelyJwt(token)) {
      return false;
    }

    const payload = this.parseJwtPayload(token);
    if (!payload?.exp || typeof payload.exp !== 'number') {
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const leewaySeconds = 30;
    return payload.exp <= nowSeconds + leewaySeconds;
  }

  private parseJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

      return JSON.parse(atob(payload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private extractAccessToken(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const source = response as Record<string, unknown>;
    const candidates: unknown[] = [
      response,
      source['result'],
      source['value'],
      source['data'],
      source['auth'],
      source['authentication'],
    ];

    for (const candidate of candidates) {
      const token = this.extractTokenFromValue(candidate);
      if (token) {
        return token;
      }
    }

    return null;
  }

  private extractTokenFromValue(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const source = value as Record<string, unknown>;
    const rawToken =
      source['accessToken'] ??
      source['token'] ??
      source['jwt'] ??
      source['access_token'];

    return typeof rawToken === 'string' && this.isLikelyJwt(rawToken) ? rawToken : null;
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
