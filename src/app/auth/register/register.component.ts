import {CommonModule} from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {
   Auth,
   createUserWithEmailAndPassword
} from '@angular/fire/auth';
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

@Component({
   selector: 'app-register',
   standalone: true,
   imports: [RouterLink, FormsModule, CommonModule, TranslateModule],
   templateUrl: './register.component.html',
   styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
   private auth = inject(Auth);
   private firestore = inject(Firestore);
   private router = inject(Router);
   private orgService = inject(OrganizationService);
   private organizationTypeService = inject(OrganizationTypeService);
   private route = inject(ActivatedRoute);
   private orgContext = inject(OrganizationContextService);
   private paymentService = inject(PaymentService);
   private toast = inject(ToastService);
   private translate = inject(TranslateService);

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

      if (this.isSubmitting) {
         return;
      }

      this.isSubmitting = true;

      try {
         const userCredential = await createUserWithEmailAndPassword(
            this.auth,
            this.email.trim(),
            this.password.trim()
         );

         const uid = userCredential.user.uid;

         await setDoc(doc(this.firestore, 'users', uid), {
            email: this.email.trim(),
            role,
            createdAt: new Date()
         });
         const orgDto: OrganizationDto = {
            id: this.organizationId ?? '',
            firebaseUid: uid,
            userRole: role,
            emailAddress: this.email
         }
         this.orgService.registerOrganization(orgDto).subscribe({
            next: (data) => {
               this.orgContext.setOrganization(data);
               this.toast.success(
                  this.translate.instant('auth.register.toastCreated'),
                  this.translate.instant('auth.register.toastWelcome')
               );
               this.router.navigate(['/admin'], {queryParams: {organizationId: data.id}});
            },
            error: (err) => {
               console.error(err);
               this.toast.error(this.translate.instant('auth.register.errors.createFailed'));
               this.isSubmitting = false;
            }
         });


      } catch (err: unknown) {
         console.error('Registration Error:', err);
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || this.translate.instant('auth.register.errors.generic'));
         this.isSubmitting = false;
      }
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
         default:
            message = maybeError?.message || this.translate.instant('auth.register.errors.generic');
            break;
      }

      const codeSuffix = this.translate.instant('auth.register.errorCode', { code });
      return `${message} ${codeSuffix}`;
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
