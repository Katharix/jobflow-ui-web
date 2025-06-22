import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { OrganizationType } from '../../../models/organization-type';
import { OrganizationTypeService } from '../../../services/organization-type.service';
import { CommonModule, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Organization, OrganizationDto } from '../../../models/organization';
import { OrganizationService } from '../../../services/organization.service';
import { PaymentService } from '../../../services/payment.service';
import { PaymentSessionRequest } from '../../../models/payment-session-request';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { US_STATES } from '../../../common/constants';
import { environment } from '../../../../environments/environment';

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
  @ViewChild('addressInput') addressInput!: ElementRef;

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


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private organizationTypeService: OrganizationTypeService,
    private cdRef: ChangeDetectorRef,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.loadOrganizationTypes();
    this.route.queryParams.subscribe(params => {
      this.planId = params['planId'];
      console.log('Received planId:', this.planId);
      if (!this.planId) {
        console.log('No planId in query params. Redirecting to home...');
        this.router.navigate(['/']); // Redirect if no planId is present
      }
    });
  }

  ngAfterViewInit(): void {
    const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;
      console.log('Google Place: ', place);
      const streetNumber = this.getComponent(place, 'street_number');
      const route = this.getComponent(place, 'route');
      this.companyAddress = `${streetNumber} ${route}`.trim();

      this.city =
        this.getComponent(place, 'locality') ||
        this.getComponent(place, 'postal_town') ||
        this.getComponent(place, 'administrative_area_level_2'); // fallback to county if city is missing

      this.state = this.getComponent(place, 'administrative_area_level_1', 'short_name');

      this.zipCode =
        this.getComponent(place, 'postal_code');
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
        console.log('Organization Types:', data);
      },
      error: (err) => console.error('Failed to load org types:', err)
    });
  }

  onSubscribe(e: Event) {
    e.preventDefault();
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
    }
    if (orgData) {
      // Call the service to create the organization and subscribe to the observable
      this.organizationService.createOrganization(orgData).subscribe({
        next: (response) => {
          console.log('Organization created successfully:', response);
          const paymentSessionRequest: PaymentSessionRequest = {
            email: response.emailAddress,
            stripePriceId: this.planId,
            quantity: 1,
            applicationFeeAmount: 75,
            orgId: response.id,
            mode: 'subscription',
            successUrl: environment.stripeSettings.successUrl,
            cancelUrl: environment.stripeSettings.cancelUrl

          }
          this.paymentService.createSubscriptionCheckout(paymentSessionRequest).subscribe({
            next: (checkoutResponse: any) => {
              console.log('Subscription Created', checkoutResponse);

              window.location.href = checkoutResponse.url;
            },
            error: (paymentError: any) => {
              console.error('Failed to create subscription:', paymentError);
            }
          });
        },
        error: (err) => {
          // Handle error, show an error message
          console.error('Failed to create organization:', err);
        }
      });
    } else {
      console.error('Organization data is invalid');
    }
    console.log('Org Info', orgData);
  }
}
