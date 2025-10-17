import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth'; // ✅ use AngularFire's Auth
import { UserSessionService } from './user-session.service';
import { OrganizationContextService } from './shared/organization-context.service';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  constructor(
    private router: Router,
    private session: UserSessionService,
    private orgContext: OrganizationContextService,
    private auth: Auth // ✅ Inject the AngularFire Auth service
  ) {}

  logout() {
    signOut(this.auth).then(() => {
      this.session.clearSession();
      this.orgContext.clearOrganization();
      this.router.navigate(['/auth/login']);
    }).catch((error) => {
      console.error('Logout error:', error);
    });
  }
}
