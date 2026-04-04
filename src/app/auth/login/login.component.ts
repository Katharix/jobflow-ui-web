import {CommonModule} from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormsModule, NgForm} from '@angular/forms';
import {AuthService} from '../services/auth.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {ToastService} from '../../common/toast/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';


@Component({
   selector: 'app-login',
   standalone: true,
   imports: [
      RouterLink,
      FormsModule,
      CommonModule,
      TranslateModule
   ],
   templateUrl: './login.component.html',
   styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private authService = inject(AuthService);
   private orgContext = inject(OrganizationContextService);
   private toast = inject(ToastService);
   private translate = inject(TranslateService);

   @ViewChild('form') form?: NgForm;

   returnUrl = '/admin';
   email = '';
   password = '';
   error: string | null = null;
   rememberMe = true;
   submitted = false;
   isSubmitting = false;
   isGoogleSubmitting = false;

   ngOnInit(): void {
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
   }

   async onLoggedin(e: Event) {
      e.preventDefault();

      this.submitted = true;
      this.error = null;
      if (this.form?.invalid) {
         this.form.control.markAllAsTouched();
         return;
      }

      if (this.isSubmitting || this.isGoogleSubmitting) {
         return;
      }

      this.isSubmitting = true;

      try {
         await this.authenticateAndSync(async () => {
            await this.authService.login(this.email.trim(), this.password);
         });
      } catch (err: unknown) {
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || this.translate.instant('auth.login.toastFailed'));
      } finally {
         this.isSubmitting = false;
      }
   }

   async onGoogleLogin(): Promise<void> {
      this.error = null;
      if (this.isSubmitting || this.isGoogleSubmitting) {
         return;
      }

      this.isGoogleSubmitting = true;

      try {
         await this.authenticateAndSync(async () => {
            await this.authService.loginWithGoogle();
         });
      } catch (err: unknown) {
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || this.translate.instant('auth.login.toastFailed'));
      } finally {
         this.isGoogleSubmitting = false;
      }
   }

   private async authenticateAndSync(authAction: () => Promise<void>): Promise<void> {
      try {
         await authAction();

         const idToken = await this.authService.getCurrentUserIdToken();
         const response = await firstValueFrom(this.authService.loginWithFirebase(idToken));
         this.orgContext.setOrganization(response.organization);
         await this.router.navigateByUrl(this.returnUrl);
      } catch (err: unknown) {
         if (this.isBackendAuthError(err)) {
            console.error('Backend login failed:', err);
            const backendFallback = this.translate.instant('auth.common.backendSyncFailed');
            const backendTitle = this.translate.instant('auth.common.backendSyncTitle');
            this.error = this.authService.getBackendErrorMessage(
               err,
               backendFallback
            );
            this.toast.error(this.error || backendFallback, backendTitle);

            // Keep Firebase and local app session in sync when backend provisioning fails.
            try {
               await this.authService.logout();
            } catch (logoutErr) {
               console.warn('Logout after backend login failure failed:', logoutErr);
            }

            this.orgContext.clearOrganization();
            return;
         }

         throw err;
      }
   }

   private isBackendAuthError(error: unknown): boolean {
      const maybeHttpError = error as { status?: number; name?: string } | null;
      return typeof maybeHttpError?.status === 'number' || maybeHttpError?.name === 'HttpErrorResponse';
   }



   private mapFirebaseAuthError(error: unknown): string {
      const maybeError = error as { code?: string; message?: string } | null;
      const code = maybeError?.code;
      if (!code) {
         return maybeError?.message || this.translate.instant('auth.login.errorGeneric');
      }

      let message: string;
      switch (code) {
         case 'auth/invalid-email':
            message = this.translate.instant('auth.login.errors.invalidEmail');
            break;
         case 'auth/user-not-found':
         case 'auth/wrong-password':
         case 'auth/invalid-credential':
            message = this.translate.instant('auth.login.errors.invalidCredentials');
            break;
         case 'auth/user-disabled':
            message = this.translate.instant('auth.login.errors.userDisabled');
            break;
         case 'auth/too-many-requests':
            message = this.translate.instant('auth.login.errors.tooManyRequests');
            break;
         case 'auth/network-request-failed':
            message = this.translate.instant('auth.login.errors.network');
            break;
         case 'auth/operation-not-allowed':
            message = this.translate.instant('auth.login.errors.notEnabled');
            break;
         case 'auth/unauthorized-domain':
            message = this.translate.instant('auth.login.errors.unauthorizedDomain');
            break;
         case 'auth/popup-closed-by-user':
            message = this.translate.instant('auth.login.errors.popupClosed');
            break;
         case 'auth/popup-blocked':
            message = this.translate.instant('auth.login.errors.popupBlocked');
            break;
         case 'auth/cancelled-popup-request':
            message = this.translate.instant('auth.login.errors.popupCancelled');
            break;
         case 'auth/account-exists-with-different-credential':
            message = this.translate.instant('auth.login.errors.accountExistsDifferentCredential');
            break;
         default:
            message = maybeError?.message || this.translate.instant('auth.login.errorGeneric');
            break;
      }
      const codeSuffix = this.translate.instant('auth.login.errorCode', { code });
      return `${message} ${codeSuffix}`;
   }

}
