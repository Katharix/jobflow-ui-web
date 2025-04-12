import { Component } from '@angular/core';
import { OrganizationType } from '../../../models/organization-type';
import { OrganizationTypeService } from '../../../services/organization-type.service';
import { CommonModule, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Organization, OrganizationDto } from '../../../models/organization';
import { OrganizationService } from '../../../services/organization.service';
import { PaymentService } from '../../../services/payment.service';
import { PaymentSessionRequest } from '../../../models/payment-session-request';

@Component({
  selector: 'app-subscribe',
  standalone: true,
  imports: [NgStyle, RouterLink, FormsModule, CommonModule],
  templateUrl: './subscribe.component.html',
  styleUrl: './subscribe.component.scss'
})
export class SubscribeComponent {
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
  selectedOrganizationTypeId: string = '';
  planId: string = '';
  constructor(
    private router: Router,
    private route: ActivatedRoute, 
    private organizationService: OrganizationService,
    private organizationTypeService: OrganizationTypeService,
    private paymentService: PaymentService
  )
  {}

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

  private loadOrganizationTypes(): void {
    this.organizationTypeService.getAllOrganizations().subscribe({
      next: (data) => {
        this.organizationTypes = data;
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
          // Handle successful response, e.g., navigate to another page or show a success message
          console.log('Organization created successfully:', response);
          const paymentSessionRequest: PaymentSessionRequest = {
            email: response.emailAddress,
            stripePriceId: this.planId,
            quantity: 1,
            applicationFeeAmount: 75,
            orgId: response.id,
            mode: 'subscription'
          }
          this.paymentService.createSubscriptionCheckout(paymentSessionRequest).subscribe({
            next: (checkoutResponse: any) => {
              console.log('Subscription Created', checkoutResponse);
              window.location.href = checkoutResponse.url;
            },
            error: (paymentError: any) =>{
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
