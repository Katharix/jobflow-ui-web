import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private readonly tokenKey = 'authToken';
  private readonly emailKey = 'userEmail';
  private readonly orgIdKey = 'orgId';
  private readonly lastActivityKey = 'lastActivity';
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes

  setSession(token: string, email: string, orgId: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.emailKey, email);
    localStorage.setItem(this.orgIdKey, orgId);
    this.updateActivity();
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.emailKey);
    localStorage.removeItem(this.orgIdKey);
    localStorage.removeItem(this.lastActivityKey);
  }

  updateActivity() {
    localStorage.setItem(this.lastActivityKey, Date.now().toString());
  }

  isSessionExpired(): boolean {
    const last = localStorage.getItem(this.lastActivityKey);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > this.sessionTimeout;
  }

  get authToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get userEmail(): string | null {
    return localStorage.getItem(this.emailKey);
  }

  get organizationId(): string | null {
    return localStorage.getItem(this.orgIdKey);
  }

  get isLoggedIn(): boolean {
    return !!this.authToken;
  }
}
