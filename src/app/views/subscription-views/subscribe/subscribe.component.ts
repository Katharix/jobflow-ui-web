import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, inject, DOCUMENT } from '@angular/core';
import { OrganizationType } from '../../../models/organization-type';
import { OrganizationTypeService } from '../../../services/shared/organization-type.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrganizationDto } from '../../../models/organization';
import { OrganizationService } from '../../../services/shared/organization.service';
import { CheckoutPaymentResponse, PaymentService } from '../../../services/shared/payment.service';
import { PaymentSessionRequest } from '../../../models/payment-session-request';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { US_STATES } from '../../../common/constants';
import { LoadingService } from '../../../services/shared/loading-service.service';
import { Observable } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

interface GoogleAddressComponent {
   long_name: string;
   short_name: string;
   types: string[];
}

interface GooglePlace {
   address_components?: GoogleAddressComponent[];
}

interface GoogleAutocomplete {
   addListener(event: string, handler: () => void): void;
   getPlace(): GooglePlace;
}

type GoogleAutocompleteConstructor = new (
   input: HTMLInputElement,
   options: { types: string[]; componentRestrictions: { country: string } }
) => GoogleAutocomplete;

interface PlanMeta {
   name: string;
   price: string;
   features: string[];
}

const PLAN_META: Record<string, PlanMeta> = {
   [environment.stripeSettings.goMonthlyPrice]: {
      name: 'Go', price: '$29/mo',
      features: ['Jobs, invoices & estimates', 'Client Hub — no client login required', 'Stripe & Square payments']
   },
   [environment.stripeSettings.goYearlyPrice]: {
      name: 'Go', price: '$278/yr',
      features: ['Jobs, invoices & estimates', 'Client Hub — no client login required', 'Stripe & Square payments']
   },
   [environment.stripeSettings.flowMonthlyPrice]: {
      name: 'Flow', price: '$59/mo',
      features: ['Everything in Go', 'Employee management + dispatch board', 'Pricebook & custom branding']
   },
   [environment.stripeSettings.flowYearlyPrice]: {
      name: 'Flow', price: '$564/yr',
      features: ['Everything in Go', 'Employee management + dispatch board', 'Pricebook & custom branding']
   },
   [environment.stripeSettings.maxMonthlyPrice]: {
      name: 'Max', price: '$89/mo',
      features: ['Everything in Flow', 'Advanced dispatch & reporting', 'Priority support']
   },
   [environment.stripeSettings.maxYearlyPrice]: {
      name: 'Max', price: '$864/yr',
      features: ['Everything in Flow', 'Advanced dispatch & reporting', 'Priority support']
   },
};


declare const google: {
   maps?: {
      places?: {
         Autocomplete?: GoogleAutocompleteConstructor;
      };
   };
};

@Component({
   selector: 'app-subscribe',
   standalone: true,
   imports: [RouterLink, FormsModule, CommonModule, TranslateModule],
   templateUrl: './subscribe.component.html',
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
   styleUrl: './subscribe.component.scss'
})
export class SubscribeComponent implements AfterViewInit, OnInit {
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private organizationService = inject(OrganizationService);
   private organizationTypeService = inject(OrganizationTypeService);
   private cdRef = inject(ChangeDetectorRef);
   private paymentService = inject(PaymentService);
   private loadingService = inject(LoadingService);
   private translate = inject(TranslateService);
   private document = inject(DOCUMENT);


   @ViewChild('addressInput') addressInput?: ElementRef<HTMLInputElement>;
   @ViewChild('form') form?: NgForm;

   email = '';
   firstName = '';
   lastName = '';
   organizationName = '';
   phoneNumber = '';
   companyAddress = '';
   companyAddress2 = '';
   city = '';
   state = '';
   zipCode = '';
   error = '';
   organizationTypes: OrganizationType[] = [];
   selectedOrganizationTypeId = '';
   planId = '';
   usStates = US_STATES;
   twilioConsent = false;
   submitted = false;

   isLoading$!: Observable<boolean>;

   get planDetails(): PlanMeta | null {
      return PLAN_META[this.planId] ?? null;
   }

   ngOnInit(): void {
       this.isLoading$ = this.loadingService.isLoading$;
      this.loadOrganizationTypes();
      this.planId =
         this.route.snapshot.queryParamMap.get('planId') ??
         this.route.snapshot.queryParamMap.get('planid') ??
         '';
   }

   ngAfterViewInit(): void {
      if (!this.addressInput?.nativeElement) return;
      this.loadGoogleMaps()
         .then(() => this.initAddressAutocomplete())
         .catch(() => console.warn('Google Places could not be loaded.'));
   }

   private loadGoogleMaps(): Promise<void> {
      return new Promise((resolve, reject) => {
         const win = this.document.defaultView as (Window & { google?: { maps?: unknown } }) | null;
         if (win?.google?.maps) {
            resolve();
            return;
         }
         const script = this.document.createElement('script');
         script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA6EiKJ8OJvywKeOFy_EoyxO4UepISyGDk&libraries=places&v=weekly&loading=async';
         script.async = true;
         script.addEventListener('load', () => resolve());
         script.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
         this.document.head.appendChild(script);
      });
   }

   private initAddressAutocomplete(): void {
      if (!this.addressInput?.nativeElement) return;

      if (!google?.maps?.places?.Autocomplete) {
         console.warn('Google Places is not available.');
         return;
      }

      const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
         types: ['address'],
         componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
         const place = autocomplete.getPlace();
         if (!place.address_components) return;

         const streetNumber = this.getComponent(place, 'street_number');
         const route = this.getComponent(place, 'route');

         this.companyAddress = `${streetNumber} ${route}`.trim();

         this.city =
            this.getComponent(place, 'locality') ||
            this.getComponent(place, 'postal_town') ||
            this.getComponent(place, 'administrative_area_level_2');

         this.state = this.getComponent(place, 'administrative_area_level_1', 'short_name');

         this.zipCode = this.getComponent(place, 'postal_code');

         this.cdRef.detectChanges();
      });
   }

   private getComponent(place: GooglePlace, type: string, format: 'short_name' | 'long_name' = 'long_name'): string {
      if (!place.address_components) return '';

      const component = place.address_components.find((comp) =>
         comp.types.includes(type)
      );

      return component ? component[format] : '';
   }

   private loadOrganizationTypes(): void {

      this.organizationTypeService.getAllOrganizations().subscribe({
         next: (data) => {

            this.organizationTypes = data
               .filter(e => e.typeName !== 'Master Account')
               .sort((a, b) => {

                  if (a.typeName === 'Other') return 1;
                  if (b.typeName === 'Other') return -1;

                  return a.typeName.localeCompare(b.typeName);
               });
         },
         error: (err: unknown) => console.error('Failed to load org types:', err)
      });
   }

 onSubscribe(e: Event) {

  e.preventDefault();

  this.submitted = true;
  if (this.form?.invalid) {
     this.form.control.markAllAsTouched();
     setTimeout(() => {
        const firstInvalid = this.document.querySelector('.is-invalid');
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }, 50);
     return;
  }

  this.loadingService.show();

  const orgData: OrganizationDto = {
     contactFirstName: this.firstName,
     contactLastName: this.lastName,
     address1: this.companyAddress,
     address2: this.companyAddress2,
     phoneNumber: this.phoneNumber,
     organizationName: this.organizationName,
     city: this.city,
     state: this.state,
     zipCode: this.zipCode,
     emailAddress: this.email,
     organizationTypeId: this.selectedOrganizationTypeId
  };

  this.organizationService.createOrganization(orgData).subscribe({

     next: (response) => {

        const appBaseUrl = window.location.origin;
        const successUrl = `${appBaseUrl}/auth/register?organizationId=${encodeURIComponent(response.id)}`;
        const cancelUrl = `${appBaseUrl}/subscribe?planId=${encodeURIComponent(this.planId)}`;

        const paymentSessionRequest: PaymentSessionRequest = {
           email: response.emailAddress,
           stripePriceId: this.planId,
           quantity: 1,
           applicationFeeAmount: 75,
           orgId: response.id,
           mode: 'subscription',
           successUrl,
           cancelUrl
        };

        // Keep loader active for second call
        this.loadingService.show();

        this.paymentService.createSubscriptionCheckout(paymentSessionRequest).subscribe({

           next: (checkoutResponse: CheckoutPaymentResponse) => {
              if (checkoutResponse?.url) {
                 window.location.href = checkoutResponse.url;
                 return;
              }
             this.error = this.translate.instant('subscribe.errors.checkoutRedirect');
              this.loadingService.hide();
           },

           error: (paymentError: unknown) => {
              console.error('Failed to create subscription:', paymentError);
              this.error = this.translate.instant('subscribe.errors.subscriptionFailed');
              this.loadingService.hide();
              this.loadingService.hide();
           }
        });

        this.loadingService.hide();
     },

     error: (err: unknown) => {
        console.error('Failed to create organization:', err);
        this.error = this.translate.instant('subscribe.errors.organizationFailed');
        this.loadingService.hide();
     }
  });
}
}