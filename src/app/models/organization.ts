import { PaymentProvider } from './customer-payment-profile';

export interface OrganizationDto {
    id?: string;
    organizationName?: string;
    firebaseUid?: string;
    organizationTypeId?: string;
    userRole?: string;
    emailAddress?: string;
  industryKey?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phoneNumber?: string;
    defaultTaxRate?: number;
    subscriptionStatus?: string;
    onboardingComplete?: boolean;
    subscriptionPlanName?: string;
    stripeConnectedAccountId?: string;
    stripeConnectAccountId?: string;
    paymentProvider?: PaymentProvider;
}

export interface Organization {
    id: string;
    organizationTypeId: string;
    stripeCustomerId?: string;
    stripeConnectedAccountId?: string;
  stripeConnectAccountId?: string;
    zipCode?: string;
    organizationName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    phoneNumber?: string;
    emailAddress?: string;
    hasFreeAccount: boolean;
    onboardingComplete: boolean;
  }
  
  export interface OrganizationRequest{
    organizationId: string;
  }