import { Estimate } from '../../admin/estimates/models/estimate';
import { Invoice } from '../../models/invoice';

export interface ClientHubProfile {
  id: string;
  organizationId: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface UpdateClientHubProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface ClientHubMagicLinkRedeemResponse {
  accessToken?: string;
  token?: string;
  jwt?: string;
  expiresAt?: string;
  result?: {
    accessToken?: string;
    token?: string;
    jwt?: string;
  };
  value?: {
    accessToken?: string;
    token?: string;
    jwt?: string;
  };
  data?: {
    accessToken?: string;
    token?: string;
    jwt?: string;
  };
  auth?: {
    accessToken?: string;
    token?: string;
    jwt?: string;
  };
  authentication?: {
    accessToken?: string;
    token?: string;
    jwt?: string;
  };
}

export interface ClientHubMagicLinkOrganizationClient {
  id: string;
  organizationId: string;
  organizationName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
}

export interface ClientHubMagicLinkRequestResponse {
  requiresOrganizationSelection?: boolean;
  clients?: ClientHubMagicLinkOrganizationClient[];
}

export interface ClientHubWorkRequest {
  subject: string;
  details: string;
  preferredDate?: string;
  budget?: number;
}

export interface ClientHubWorkRequestResponse {
  id?: string;
  status?: string;
}

export type ClientHubEstimate = Estimate;
export type ClientHubInvoice = Invoice;

export interface ClientHubInvoiceCheckoutResponse {
  url: string;
}
