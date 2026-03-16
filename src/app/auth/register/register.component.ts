import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
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

@Component({
   selector: 'app-register',
   standalone: true,
   imports: [RouterLink, FormsModule, CommonModule],
   templateUrl: './register.component.html',
   styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
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

   constructor(
      private auth: Auth,
      private firestore: Firestore,
      private router: Router,
      private orgService: OrganizationService,
      private organizationTypeService: OrganizationTypeService,
      private route: ActivatedRoute,
      private orgContext: OrganizationContextService,
      private paymentService: PaymentService
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

      if (this.password.trim() !== this.confirmPassword.trim()) {
         this.error = 'Passwords do not match';
         return;
      }

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
               this.router.navigate(['/admin'], {queryParams: {organizationId: data.id}});
            },
            error: (err) => console.error(err)
         });


      } catch (err: any) {
         console.error('Registration Error:', err);
         this.error = err.message;
      }
   }

   async loginWithGoogle() {
      const provider = new GoogleAuthProvider();
      this.error = '';
      const role = 'OrganizationAdmin';
      signInWithPopup(this.auth, provider)
         .then(async (result) => {
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
                        await this.startPaymentProviderOnboarding(data.id);
                        // this.router.navigate(['/admin']);
                     },
                     error: (err) => console.error(err)
                  });


               } catch (err: any) {
                  console.error('Registration Error:', err);
                  this.error = err.message;
               }
            } else {
               // Existing user: proceed to dashboard
            }
         });
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
