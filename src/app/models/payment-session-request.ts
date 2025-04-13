export interface PaymentSessionRequest {
    mode?: string;
    stripePriceId?: string;
    stripeCustomerId?: string;
    paymentProfileId?: string;
    productName?: string;
    amount?: number;
    quantity?: number;
    applicationFeeAmount?: number;
    cancelUrl?: string;
    connectedAccountId?: string;
    email?: string;
    orgId: string;
    successUrl?: string;
  }
  