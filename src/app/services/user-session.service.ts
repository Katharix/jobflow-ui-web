import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private readonly tokenKey = 'authToken';
  private readonly emailKey = 'userEmail';
  private readonly orgIdKey = 'orgId';

  setSession(token: string, email: string, orgId: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.emailKey, email);
    localStorage.setItem(this.orgIdKey, orgId);
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.emailKey);
    localStorage.removeItem(this.orgIdKey);
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
