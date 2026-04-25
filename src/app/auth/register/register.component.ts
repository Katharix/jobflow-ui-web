import {CommonModule} from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Organization, OrganizationRequest, OrganizationDto} from '../../models/organization';
import {OrganizationType} from '../../models/organization-type';
import {OrganizationTypeService} from '../../services/shared/organization-type.service';
import {OrganizationService} from '../../services/shared/organization.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import { EMPTY, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaymentService } from '../../services/shared/payment.service';
import { PaymentProvider } from '../../models/customer-payment-profile';
import { ToastService } from '../../common/toast/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { UserCredential } from 'firebase/auth';
import { OnboardingService } from '../../views/general/onboarding-checklist/services/onboarding.service';

@Component({
   selector: 'app-register',
   standalone: true,
   imports: [RouterLink, FormsModule, CommonModule, TranslateModule],
   templateUrl: './register.component.html',
   styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
   private router = inject(Router);
   private orgService = inject(OrganizationService);
   private organizationTypeService = inject(OrganizationTypeService);
   private route = inject(ActivatedRoute);
   private orgContext = inject(OrganizationContextService);
   private paymentService = inject(PaymentService);
   private toast = inject(ToastService);
   private translate = inject(TranslateService);
   private authService = inject(AuthService);
   private cdr = inject(ChangeDetectorRef);
   private destroyRef = inject(DestroyRef);
   private onboardingService = inject(OnboardingService);

   @ViewChild('form') form?: NgForm;

   email = '';
   firstName = '';
   lastName = '';
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
   isOrgDataLoading = false;
   orgDataLoadFailed = false;
   orgSize: 'solo' | 'small_team' = 'solo';

   ngOnInit(): void {
      this.loadOrganizationTypes();

      const initialOrgId = this.normalizeOrganizationId(
         this.route.snapshot.queryParamMap.get('organizationId')
      );

      if (initialOrgId) {
         this.organizationId = initialOrgId;
         this.getOrganizationData(initialOrgId);
      }

      this.route.queryParamMap
         .pipe(
            map(params => this.normalizeOrganizationId(params.get('organizationId'))),
            takeUntilDestroyed(this.destroyRef)
         )
         .subscribe((orgId) => {
            if (orgId && orgId !== this.organizationId) {
               this.organizationId = orgId;
               this.getOrganizationData(orgId);
            }
         });
   }

   private getOrganizationData(orgId: string) {
      this.isOrgDataLoading = true;
      this.orgDataLoadFailed = false;

      const orgRequest: OrganizationRequest = {
         organizationId: orgId
      }

      this.orgService.getOrganizationById(orgRequest).subscribe({
         next: (data: OrganizationDto) => {
            this.email = data.emailAddress ?? data.email ?? '';
            this.organizationName = data.organizationName ?? '';
            this.firstName = data.contactFirstName ?? '';
            this.lastName = data.contactLastName ?? '';
            this.isOrgDataLoading = false;
            this.cdr.detectChanges();
         },
         error: (err) => {
            console.error('Failed to load organization data:', err);
            this.isOrgDataLoading = false;
            this.orgDataLoadFailed = true;
            this.toast.error(this.translate.instant('auth.register.errors.orgLoadFailed'));
         }
      });
   }

   private normalizeOrganizationId(rawValue: string | null): string | null {
      if (!rawValue) {
         return null;
      }

      const guidMatch = rawValue.match(
         /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
      );

      return guidMatch ? guidMatch[0] : null;
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
      let createdCredential: UserCredential | null = null;

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
         createdCredential = await this.authService.register(
            this.email.trim(),
            this.password.trim()
         );

         await this.completeRegistration(createdCredential.user.uid, this.email.trim(), role);

      } catch (err: unknown) {
         console.error('Registration Error:', err);
         if (this.isBackendAuthError(err)) {
            const backendFallback = this.translate.instant('auth.common.backendSyncFailed');
            const backendTitle = this.translate.instant('auth.common.backendSyncTitle');
            this.error = this.authService.getBackendErrorMessage(
               err,
               backendFallback
            );

            // Email/password users are just created locally before server sync.
            // If server sync fails, remove the fresh Firebase user so retry works cleanly.
            if (createdCredential?.user) {
               try {
                  await createdCredential.user.delete();
               } catch (deleteErr) {
                  console.warn('Failed to rollback newly created Firebase user:', deleteErr);
               }
            }

            this.toast.error(this.error || backendFallback, backendTitle);
         } else {
            this.error = this.mapFirebaseAuthError(err);
            this.toast.error(this.error || this.translate.instant('auth.register.errors.generic'));
         }
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
         // Use Google profile name if first/last name not already provided
         if (!this.firstName && userCredential.user.displayName) {
            const parts = userCredential.user.displayName.split(' ');
            this.firstName = parts[0] ?? '';
            this.lastName = parts.slice(1).join(' ') ?? '';
         }
         await this.completeRegistration(userCredential.user.uid, googleEmail, role);
      } catch (err: unknown) {
         console.error('Google Registration Error:', err);
         if (this.isBackendAuthError(err)) {
            const backendFallback = this.translate.instant('auth.common.backendSyncFailed');
            const backendTitle = this.translate.instant('auth.common.backendSyncTitle');
            this.error = this.authService.getBackendErrorMessage(
               err,
               backendFallback
            );

            try {
               await this.authService.logout();
            } catch (logoutErr) {
               console.warn('Failed to logout after backend registration error:', logoutErr);
            }

            this.toast.error(this.error || backendFallback, backendTitle);
         } else {
            this.error = this.mapFirebaseAuthError(err);
            this.toast.error(this.error || this.translate.instant('auth.register.errors.generic'));
         }
      } finally {
         this.isSubmitting = false;
      }
   }

   private async completeRegistration(uid: string, email: string, role: string): Promise<void> {
      const orgDto: OrganizationDto = {
         id: this.organizationId ?? '',
         firebaseUid: uid,
         userRole: role,
         firstName: this.firstName,
         lastName: this.lastName,
         emailAddress: email,
         orgSize: this.orgSize
      };

      const data = await firstValueFrom(this.orgService.registerOrganization(orgDto));
      await this.authService.getCurrentUserIdToken(true);
      this.orgContext.setOrganization(data);
      // Fire-and-forget: seed industry-specific pricebook defaults
      this.onboardingService.seedIndustryDefaults().pipe(catchError(() => EMPTY)).subscribe();
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
