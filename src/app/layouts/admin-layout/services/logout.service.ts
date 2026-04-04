import { Injectable, inject } from '@angular/core';
import {Router} from '@angular/router';
import {Auth, signOut} from '@angular/fire/auth';
import {OrganizationContextService} from '../../../services/shared/organization-context.service';

@Injectable({providedIn: 'root'})
export class LogoutService {
   private router = inject(Router);
   private auth = inject(Auth);
   private orgContext = inject(OrganizationContextService);

   private isLoggingOut = false;

   async logout(): Promise<void> {
      if (this.isLoggingOut) return;
      this.isLoggingOut = true;

      try {
         try {
            await signOut(this.auth);
         } catch (err) {
            console.warn('Sign out error (ignored):', err);
         }

         this.orgContext.clearOrganization();

         await this.router.navigateByUrl('/auth/login');
      } finally {
         this.isLoggingOut = false;
      }
   }
}
