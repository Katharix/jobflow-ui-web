import {CommonModule} from '@angular/common';
import {Component, OnInit, ViewChild} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {
   Auth,
   createUserWithEmailAndPassword,
   getAdditionalUserInfo,
   GoogleAuthProvider,
   signInWithPopup
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
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../common/toast/toast.service';

@Component({
   selector: 'app-register',
   standalone: true,
   imports: [RouterLink, FormsModule, CommonModule],
   templateUrl: './register.component.html',
   styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
   @ViewChild('form') form?: NgForm;

   email: string = '';
   organizationName: string = '';
   password: string = '';
   confirmPassword: string = '';
   error: string = '';
   organization: Organization;
   organizationTypes: OrganizationType[] = [];
   organizationId: string | null = null;
   selectedOrganizationTypeId: string = '';
   pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])\\S+$';
   submitted = false;
   isSubmitting = false;
   isGoogleLoading = false;
   private googleTimeoutId: number | null = null;

   constructor(
      private auth: Auth,
      private firestore: Firestore,
      private router: Router,
      private orgService: OrganizationService,
      private organizationTypeService: OrganizationTypeService,
      private route: ActivatedRoute,
      private orgContext: OrganizationContextService,
      private paymentService: PaymentService,
      private authService: AuthService,
      private toast: ToastService
   ) {
   }

   ngOnInit(): void {
      this.loadOrganizationTypes();
      this.organizationId = this.route.snapshot.queryParamMap.get('organizationId');

      if (this.organizationId) {
         this.getOrganizationData(this.organizationId);
      }
   }

   private getOrganizationData(orgId: string) {
      let orgRequest: OrganizationRequest = {
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


      } catch (err: any) {
         console.error('Registration Error:', err);
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || 'Registration failed.');
         this.isSubmitting = false;
      }
   }

   async loginWithGoogle() {
      const provider = new GoogleAuthProvider();
      this.error = '';

      if (this.isGoogleLoading || this.isSubmitting) {
         return;
      }

      this.isGoogleLoading = true;
      this.startGoogleTimeout();
      try {
         const result = await signInWithPopup(this.auth, provider);
         await this.handleGoogleResult(result);
      } catch (error: any) {
         console.error('Google login error:', error);
         this.error = this.mapFirebaseAuthError(error);
         this.toast.error(this.error || 'Google sign-in failed. Please try again.');
      } finally {
         this.isGoogleLoading = false;
         this.clearGoogleTimeout();
      }
   }

   private async handleGoogleResult(result: any): Promise<void> {
      const role = 'OrganizationAdmin';
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser;

      if (isNewUser) {
         try {
            const uid = user.uid;

            await setDoc(doc(this.firestore, 'users', uid), {
               email: user.email,
               role,
               createdAt: new Date()
            });

            const orgDto: OrganizationDto = {
               organizationName: this.organizationName,
               firebaseUid: uid,
               organizationTypeId: this.selectedOrganizationTypeId,
               userRole: role,
               emailAddress: user.email ?? this.email.trim()
            }
            this.orgService.registerOrganization(orgDto).subscribe({
               next: async (data) => {
                  this.orgContext.setOrganization(data);
                  this.toast.success('Account created', 'Google sign-in');
                  await this.startPaymentProviderOnboarding(data.id);
               },
               error: (err) => {
                  console.error(err);
                  this.toast.error('Failed to create account.');
               }
            });

         } catch (err: any) {
            console.error('Registration Error:', err);
            this.error = this.mapFirebaseAuthError(err);
            this.toast.error(this.error || 'Registration failed.');
         }
      } else {
         const idToken = await user.getIdToken();
         this.authService.loginWithFirebase(idToken).subscribe({
            next: (res) => {
               if (res?.organization) {
                  this.orgContext.setOrganization(res.organization);
               }
               this.toast.success('Signed in with Google', 'Success');
               this.router.navigate(['/admin']);
            },
            error: (err) => {
               console.error('Backend login error:', err);
               this.error = 'Login failed. Please try again.';
               this.toast.error('Login failed. Please try again.');
            }
         });
      }
   }

   private mapFirebaseAuthError(error: any): string {
      const code = error?.code as string | undefined;
      if (!code) {
         return error?.message || 'Something went wrong. Please try again.';
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
         case 'auth/popup-blocked':
            message = 'Popup blocked. Allow popups and try again.';
            break;
         case 'auth/popup-closed-by-user':
            message = 'Popup closed before sign-in completed.';
            break;
         case 'auth/cancelled-popup-request':
            message = 'Another sign-in popup is already open.';
            break;
         case 'auth/network-request-failed':
            message = 'Network error. Check your connection and try again.';
            break;
         case 'auth/operation-not-allowed':
            message = 'Google sign-in is not enabled for this project.';
            break;
         case 'auth/unauthorized-domain':
            message = 'This domain is not authorized for sign-in.';
            break;
         default:
            message = error?.message || 'Something went wrong. Please try again.';
            break;
      }

      return `${message} (code: ${code})`;
   }

   private startGoogleTimeout(): void {
      this.clearGoogleTimeout();
      this.googleTimeoutId = window.setTimeout(() => {
         if (!this.isGoogleLoading) {
            return;
         }

         this.isGoogleLoading = false;
         this.error = 'Google sign-in did not complete. Close the popup and try again. (code: auth/popup-timeout)';
         this.toast.error(this.error);
      }, 20000);
   }

   private clearGoogleTimeout(): void {
      if (this.googleTimeoutId !== null) {
         window.clearTimeout(this.googleTimeoutId);
         this.googleTimeoutId = null;
      }
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
