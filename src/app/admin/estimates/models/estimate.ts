import { OrganizationClient } from '../../../models/invoice';

export type EstimateOrganizationClient = Partial<OrganizationClient> & {
  organization?: OrganizationClient['organization'];
};

export interface Estimate {
  id: string;
  estimateNumber: string;
  organizationId: string;
  organizationClientId: string;
  estimateDate?: string;
  expirationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string;
  title?: string | null;
  description?: string | null;
  subtotal?: number;
  taxTotal?: number;
  notes?: string;
  total: number;
  status: EstimateStatus | string;
  organizationClient?: EstimateOrganizationClient;
  lineItems?: EstimateLineItem[];
  publicToken?: string;
}

export enum EstimateStatus {
  Draft = 0,
  Sent = 1,
  Accepted = 2,
  Declined = 3,
  Cancelled = 4,
  Expired = 5,
  RevisionRequested = 6,
}

export const EstimateStatusLabels: Record<EstimateStatus, string> = {
  [EstimateStatus.Draft]: 'Draft',
  [EstimateStatus.Sent]: 'Sent',
  [EstimateStatus.Accepted]: 'Accepted',
  [EstimateStatus.Declined]: 'Declined',
  [EstimateStatus.Cancelled]: 'Cancelled',
  [EstimateStatus.Expired]: 'Expired',
  [EstimateStatus.RevisionRequested]: 'Revision Requested',
};

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  priceBookItemId?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface EstimateLineItemRequest {
  priceBookItemId?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateEstimateRequest {
  organizationClientId: string;
  estimateDate?: string;
  expirationDate?: string;
  notes?: string;
  lineItems: EstimateLineItemRequest[];
}

export interface UpdateEstimateRequest {
  estimateDate?: string;
  expirationDate?: string;
  notes?: string;
  lineItems: EstimateLineItemRequest[];
}

export interface SendEstimateRequest {
  recipientEmail: string;
  message?: string;
}
