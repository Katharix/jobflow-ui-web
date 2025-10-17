import { CustomerPaymentProfileDto } from "./customer-payment-profile";
import { BrandingDto } from "./organization-branding";

export interface Onboarding {
  organizationId: string;
  onboardingComplete: boolean;
  defaultTaxRate: number;
  enableTax: boolean;
  branding: BrandingDto;
  paymentProfile: CustomerPaymentProfileDto;
}