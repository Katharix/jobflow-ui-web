import {CommonModule} from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {doc, Firestore, setDoc} from '@angular/fire/firestore';
import {Organization, OrganizationRequest, OrganizationDto} from '../../models/organization';
import {OrganizationType} from '../../models/organization-type';
import {OrganizationTypeService} from '../../services/shared/organization-type.service';
import {OrganizationService} from '../../services/shared/organization.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from '../../services/shared/payment.service';
import { PaymentProvider } from '../../models/customer-payment-profile';
import { ToastService } from '../../common/toast/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

@Component({
   selector: 'app-register',
   standalone: true,
   imports: [RouterLink, FormsModule, CommonModule, TranslateModule],
   templateUrl: './register.component.html',
   styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
   private firestore = inject(Firestore);
   private router = inject(Router);
   private orgService = inject(OrganizationService);
   private organizationTypeService = inject(OrganizationTypeService);
   private route = inject(ActivatedRoute);
   private orgContext = inject(OrganizationContextService);
   private paymentService = inject(PaymentService);
   private toast = inject(ToastService);
   private translate = inject(TranslateService);
   private authService = inject(AuthService);

   @ViewChild('form') form?: NgForm;

   email = '';
   organizationName = '';
   password = '';
   confirmPassword = '';
   error = '';
   organization: Organization;
   organizationTypes: OrganizationType[] = [];
   organizationId: string | null = null;
   selectedOrganizationTypeId = '';
   pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])\\S+$';
   submitted = false;
   isSubmitting = false;

   ngOnInit(): void {
      this.loadOrganizationTypes();
      this.organizationId = this.route.snapshot.queryParamMap.get('organizationId');

      if (this.organizationId) {
         this.getOrganizationData(this.organizationId);
      }
   }

   private getOrganizationData(orgId: string) {
      const orgRequest: OrganizationRequest = {
         organizationId: orgId
      }
      this.orgService.getOrganizationById(orgRequest).subscribe({
         next: (data: Organization) => {
            this.email = data.emailAddress ?? '';
            this.organizationName = data.organizationName ?? '';
         },
         error: (err) => console.error(err)
      });
   }

   private loadOrganizationTypes(): void {
      this.organizationTypeService.getAllOrganizations().subscribe({
         next: (data) => {
            this.organizationTypes = data;
         },
         error: (err) => console.error('Failed to load org types:', err)
      });
   }

   onRegister(e: Event) {
      e.preventDefault();
      this.register();
   }

   async register() {
      this.error = '';
      const role = 'OrganizationAdmin';
      this.submitted = true;

      if (this.form?.invalid) {
         this.form.control.markAllAsTouched();
         return;
      }

      if (this.password.trim() !== this.confirmPassword.trim()) {
         this.error = this.translate.instant('auth.register.errors.passwordMismatch');
         this.toast.error(this.translate.instant('auth.register.errors.passwordMismatch'));
         return;
      }

      if (!this.organizationId) {
         this.error = this.translate.instant('auth.register.errors.missingOrganization');
         this.toast.error(this.error);
         return;
      }

      if (this.isSubmitting) {
         return;
      }

      this.isSubmitting = true;

      try {
         const userCredential = await this.authService.register(
            this.email.trim(),
            this.password.trim()
         );

         await this.completeRegistration(userCredential.user.uid, this.email.trim(), role);

      } catch (err: unknown) {
         console.error('Registration Error:', err);
         if (this.isBackendAuthError(err)) {
            this.error = this.translate.instant('auth.register.errors.serverSyncFailed');
         } else {
            this.error = this.mapFirebaseAuthError(err);
         }
         this.toast.error(this.error || this.translate.instant('auth.register.errors.generic'));
      } finally {
         this.isSubmitting = false;
      }
   }

   async onGoogleRegister(): Promise<void> {
      this.error = '';

      if (!this.organizationId) {
         this.error = this.translate.instant('auth.register.errors.missingOrganization');
         this.toast.error(this.error);
         return;
      }

      if (this.isSubmitting) {
         return;
      }

      this.isSubmitting = true;
      const role = 'OrganizationAdmin';

      try {
         const userCredential = await this.authService.loginWithGoogle();
         const googleEmail = userCredential.user.email?.trim();

         if (!googleEmail) {
            throw new Error(this.translate.instant('auth.register.errors.googleMissingEmail'));
         }

         const invitedEmail = this.email.trim();
         if (invitedEmail && invitedEmail.toLowerCase() !== googleEmail.toLowerCase()) {
            this.error = this.translate.instant('auth.register.errors.googleEmailMismatch');
            this.toast.error(this.error);
            await this.authService.logout();
            return;
         }

         this.email = googleEmail;
         await this.completeRegistration(userCredential.user.uid, googleEmail, role);
      } catch (err: unknown) {
         console.error('Google Registration Error:', err);
         if (this.isBackendAuthError(err)) {
            this.error = this.translate.instant('auth.register.errors.serverSyncFailed');
         } else {
            this.error = this.mapFirebaseAuthError(err);
         }
         this.toast.error(this.error || this.translate.instant('auth.register.errors.generic'));
      } finally {
         this.isSubmitting = false;
      }
   }

   private async completeRegistration(uid: string, email: string, role: string): Promise<void> {
      await setDoc(doc(this.firestore, 'users', uid), {
         email,
         role,
         createdAt: new Date()
      });

      const orgDto: OrganizationDto = {
         id: this.organizationId ?? '',
         firebaseUid: uid,
         userRole: role,
         emailAddress: email
      };

      const data = await firstValueFrom(this.orgService.registerOrganization(orgDto));
      this.orgContext.setOrganization(data);
      this.toast.success(
         this.translate.instant('auth.register.toastCreated'),
         this.translate.instant('auth.register.toastWelcome')
      );
      await this.router.navigate(['/admin'], {queryParams: {organizationId: data.id}});
   }


   private mapFirebaseAuthError(error: unknown): string {
      const maybeError = error as { code?: string; message?: string } | null;
      const code = maybeError?.code;
      if (!code) {
         return maybeError?.message || this.translate.instant('auth.register.errors.generic');
      }

      let message: string;
      switch (code) {
         case 'auth/invalid-email':
            message = this.translate.instant('auth.register.errors.invalidEmail');
            break;
         case 'auth/email-already-in-use':
            message = this.translate.instant('auth.register.errors.emailInUse');
            break;
         case 'auth/weak-password':
            message = this.translate.instant('auth.register.errors.weakPassword');
            break;
         case 'auth/too-many-requests':
            message = this.translate.instant('auth.register.errors.tooManyRequests');
            break;
         case 'auth/network-request-failed':
            message = this.translate.instant('auth.register.errors.network');
            break;
         case 'auth/operation-not-allowed':
            message = this.translate.instant('auth.register.errors.notEnabled');
            break;
         case 'auth/unauthorized-domain':
            message = this.translate.instant('auth.register.errors.unauthorizedDomain');
            break;
         case 'auth/popup-closed-by-user':
            message = this.translate.instant('auth.register.errors.popupClosed');
            break;
         case 'auth/popup-blocked':
            message = this.translate.instant('auth.register.errors.popupBlocked');
            break;
         case 'auth/cancelled-popup-request':
            message = this.translate.instant('auth.register.errors.popupCancelled');
            break;
         case 'auth/account-exists-with-different-credential':
            message = this.translate.instant('auth.register.errors.accountExistsDifferentCredential');
            break;
         default:
            message = maybeError?.message || this.translate.instant('auth.register.errors.generic');
            break;
      }

      const codeSuffix = this.translate.instant('auth.register.errorCode', { code });
      return `${message} ${codeSuffix}`;
   }

   private isBackendAuthError(error: unknown): boolean {
      const maybeHttpError = error as { status?: number; name?: string } | null;
      return typeof maybeHttpError?.status === 'number' || maybeHttpError?.name === 'HttpErrorResponse';
   }

   async startPaymentProviderOnboarding(orgId?: string) {
      if (!orgId) {
         return;
      }

      try {
         const onboardingResponse = await firstValueFrom(this.paymentService.createConnectedAccount(PaymentProvider.Stripe));
         if (onboardingResponse?.onboarding) {
            window.location.href = onboardingResponse.onboarding;
         }
      } catch (error) {
         console.error('Error during payment onboarding:', error);
         alert(this.translate.instant('auth.register.errors.generic'));
      }
   }
}
