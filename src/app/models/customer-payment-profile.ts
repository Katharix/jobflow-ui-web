export interface CustomerPaymentProfileDto {
  ownerId: string; 
  ownerType: PaymentEntityType;
  provider: PaymentProvider;
  providerCustomerId: string;
}

export enum PaymentEntityType {
  Organization = 1,
  Customer = 2,
}

export enum PaymentProvider {
  Stripe = 1,
  Square = 2,
}