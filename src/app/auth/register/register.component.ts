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

@Component({
    selector: 'app-register',
    imports: [RouterLink, FormsModule, CommonModule],
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
         this.error = 'Passwords do not match';
         this.toast.error('Passwords do not match.');
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
               this.toast.success('Account created', 'Welcome');
               this.router.navigate(['/admin'], {queryParams: {organizationId: data.id}});
            },
            error: (err) => {
               console.error(err);
               this.toast.error('Failed to create account.');
               this.isSubmitting = false;
            }
         });


      } catch (err: unknown) {
         console.error('Registration Error:', err);
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || 'Registration failed.');
         this.isSubmitting = false;
      }
   }


   private mapFirebaseAuthError(error: unknown): string {
      const maybeError = error as { code?: string; message?: string } | null;
      const code = maybeError?.code;
      if (!code) {
         return maybeError?.message || 'Something went wrong. Please try again.';
      }

      let message: string;
      switch (code) {
         case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
         case 'auth/email-already-in-use':
            message = 'That email is already in use. Try signing in instead.';
            break;
         case 'auth/weak-password':
            message = 'Password is too weak. Use at least 8 characters.';
            break;
         case 'auth/too-many-requests':
            message = 'Too many attempts. Please wait a moment and try again.';
            break;
         case 'auth/network-request-failed':
            message = 'Network error. Check your connection and try again.';
            break;
         case 'auth/operation-not-allowed':
            message = 'Email/password sign-up is not enabled for this project.';
            break;
         case 'auth/unauthorized-domain':
            message = 'This domain is not authorized for sign-in.';
            break;
         default:
            message = maybeError?.message || 'Something went wrong. Please try again.';
            break;
      }

      return `${message} (code: ${code})`;
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
         alert('Something went wrong. Please try again.');
      }
   }
}
