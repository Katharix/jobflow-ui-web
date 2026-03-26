import {CommonModule} from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormsModule, NgForm} from '@angular/forms';
import {Auth} from '@angular/fire/auth';
import {AuthService} from '../services/auth.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {ToastService} from '../../common/toast/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


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
   private auth = inject(Auth);
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private authService = inject(AuthService);
   private orgContext = inject(OrganizationContextService);
   private toast = inject(ToastService);
   private translate = inject(TranslateService);

   @ViewChild('form') form?: NgForm;

   returnUrl = '/';
   email = '';
   password = '';
   error: string | null = null;
   rememberMe = true;
   submitted = false;

   ngOnInit(): void {
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
   }

   async onLoggedin(e: Event) {
      e.preventDefault();

      this.submitted = true;
      if (this.form?.invalid) {
         this.form.control.markAllAsTouched();
         return;
      }

      try {
         // ✅ Step 1: Sign in with Firebase
         await this.authService.login(this.email, this.password);


         // ✅ Step 2: Get the ID token
         const currentUser = this.auth.currentUser;
         if (!currentUser) throw new Error('No current user found');
         const idToken = await currentUser.getIdToken();

         // ✅ Step 3: Call backend to sync/create user
         this.authService.loginWithFirebase(idToken).subscribe({
            next: (res) => {

               this.orgContext.setOrganization(res.organization);
               this.router.navigate(['/admin']);
            },
            error: (err: unknown) => {
               console.error('Backend login failed:', err);
               this.error = this.translate.instant('auth.login.serverError');
               this.toast.error(this.translate.instant('auth.login.toastFailed'));
            }
         });
      } catch (err: unknown) {
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || this.translate.instant('auth.login.toastFailed'));
      }
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
         default:
            message = maybeError?.message || this.translate.instant('auth.login.errorGeneric');
            break;
      }
      const codeSuffix = this.translate.instant('auth.login.errorCode', { code });
      return `${message} ${codeSuffix}`;
   }

}
