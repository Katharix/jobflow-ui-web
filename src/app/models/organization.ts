export interface OrganizationDto {
    organizationName: string;
    firebaseUid: string;
    organizationTypeId: string;
    userRole: string;
    emailAddress: string;
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
  }
  