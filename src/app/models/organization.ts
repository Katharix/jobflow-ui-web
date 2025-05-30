export interface OrganizationDto {
    id?: string;
    organizationName?: string;
    firebaseUid?: string;
    organizationTypeId?: string;
    userRole?: string;
    emailAddress?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phoneNumber?: string;
    onBoardingComplete?: boolean;
}

export interface Organization {
    id: string;
    organizationTypeId: string;
    stripeCustomerId?: string;
    stripeConnectedAccountId?: string;
    zipCode?: string;
    organizationName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    phoneNumber?: string;
    emailAddress?: string;
    hasFreeAccount: boolean;
    onBoardingComplete: boolean;
  }
  
  export interface OrganizationRequest{
    organizationId: string;
  }