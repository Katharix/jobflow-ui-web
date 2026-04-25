import { PaymentProvider } from './customer-payment-profile';

export interface OrganizationDto {
    id?: string;
    organizationName?: string;
    contactFirstName?: string;
    contactLastName?: string;
  email?: string;
    firebaseUid?: string;
    firstName?: string;
    lastName?: string;
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
    subscriptionExpiresAt?: string;
    onboardingComplete?: boolean;
    subscriptionPlanName?: string;
    stripeConnectedAccountId?: string;
    stripeConnectAccountId?: string;
    paymentProvider?: PaymentProvider;
    squareMerchantId?: string;
    isSquareConnected?: boolean;
    isStripeConnected?: boolean;
    canAcceptPayments?: boolean;
    paymentSetupDeferred?: boolean;
    orgSize?: string;
}

export interface Organization {
    id: string;
    organizationTypeId: string;
    stripeCustomerId?: string;
    stripeConnectedAccountId?: string;
    stripeConnectAccountId?: string;
    squareMerchantId?: string;
    isSquareConnected?: boolean;
    isStripeConnected?: boolean;
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
    subscriptionStatus?: string;
    subscriptionExpiresAt?: string;
  }
  
  export interface OrganizationRequest{
    organizationId: string;
  }