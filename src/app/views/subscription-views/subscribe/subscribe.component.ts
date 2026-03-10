import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { OrganizationType } from '../../../models/organization-type';
import { OrganizationTypeService } from '../../../services/organization-type.service';
import { CommonModule, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrganizationDto } from '../../../models/organization';
import { OrganizationService } from '../../../services/organization.service';
import { PaymentService } from '../../../services/payment.service';
import { PaymentSessionRequest } from '../../../models/payment-session-request';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { US_STATES } from '../../../common/constants';
import { environment } from '../../../../environments/environment';
import { LoadingService } from '../../../services/loading-service.service';
import { Observable } from 'rxjs';

declare const google: any;

@Component({
   selector: 'app-subscribe',
   standalone: true,
   imports: [NgStyle, RouterLink, FormsModule, CommonModule],
   templateUrl: './subscribe.component.html',
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
   styleUrl: './subscribe.component.scss'
})
export class SubscribeComponent implements AfterViewInit, OnInit {

   @ViewChild('addressInput') addressInput?: ElementRef<HTMLInputElement>;

   email: string = '';
   organizationName: string = '';
   phoneNumber: string = '';
   companyAddress: string = '';
   companyAddress2: string = '';
   city: string = '';
   state: string = '';
   zipCode: string = '';
   error: string = '';
   organizationTypes: OrganizationType[] = [];
   selectedOrganizationTypeId: string = '00000000-0000-0000-0000-000000000000';
   planId: string = '';
   usStates = US_STATES;
   twilioConsent: boolean = false;

   isLoading$!: Observable<boolean>;

   constructor(
      private router: Router,
      private route: ActivatedRoute,
      private organizationService: OrganizationService,
      private organizationTypeService: OrganizationTypeService,
      private cdRef: ChangeDetectorRef,
      private paymentService: PaymentService,
      private loadingService: LoadingService
   ) {}

   ngOnInit(): void {
       this.isLoading$ = this.loadingService.isLoading$;
      this.loadOrganizationTypes();
      this.planId = this.route.snapshot.queryParamMap.get('planId') ?? '';
   }

   ngAfterViewInit(): void {
      if (!this.addressInput?.nativeElement) return;

      if (!google?.maps?.places?.Autocomplete) {
         console.warn('Google Places is not available yet.');
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

   private getComponent(place: any, type: string, format: 'short_name' | 'long_name' = 'long_name'): string {

      if (!place.address_components) return '';

      const component = place.address_components.find((comp: any) =>
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
         error: (err) => console.error('Failed to load org types:', err)
      });
   }

 onSubscribe(e: Event) {

  e.preventDefault();

  this.loadingService.show();

  const orgData: OrganizationDto = {
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

        const paymentSessionRequest: PaymentSessionRequest = {
           email: response.emailAddress,
           stripePriceId: this.planId,
           quantity: 1,
           applicationFeeAmount: 75,
           orgId: response.id,
           mode: 'subscription',
           successUrl: environment.stripeSettings.successUrl,
           cancelUrl: environment.stripeSettings.cancelUrl
        };

        // Keep loader active for second call
        this.loadingService.show();

        this.paymentService.createSubscriptionCheckout(paymentSessionRequest).subscribe({

           next: (checkoutResponse: any) => {

              // Redirect to Stripe
              window.location.href = checkoutResponse.url;
           },

           error: (paymentError: any) => {

              console.error('Failed to create subscription:', paymentError);
              this.error = 'Failed to create subscription. Please try again.';
              this.loadingService.hide();
              this.loadingService.hide();
           }
        });

        this.loadingService.hide();
     },

     error: (err) => {

        console.error('Failed to create organization:', err);
        this.error = 'Failed to create organization. Please try again.';
        this.loadingService.hide();
     }
  });
}
}