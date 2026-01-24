import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Auth, signOut} from '@angular/fire/auth';
import {OrganizationContextService} from './shared/organization-context.service';

@Injectable({providedIn: 'root'})
export class LogoutService {
   private isLoggingOut = false;

   constructor(
      private router: Router,
      private auth: Auth,
      private orgContext: OrganizationContextService
   ) {
   }

   async logout(): Promise<void> {
      if (this.isLoggingOut) return;
      this.isLoggingOut = true;

      try {
         await signOut(this.auth);
      } catch (err) {
         // Firebase signOut is idempotent; failures here are non-fatal
         console.warn('Sign out error (ignored):', err);
      }

      // 🔥 Clear app-level state ONLY (not auth)
      this.orgContext.clearOrganization();

      await this.router.navigateByUrl('/auth/login');

      this.isLoggingOut = false;
   }
}
