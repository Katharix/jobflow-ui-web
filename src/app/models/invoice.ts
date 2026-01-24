import {OrganizationDto} from "./organization";

export interface Invoice {
   id: string;
   invoiceNumber: string;
   organizationId: string;
   organizationClientId: string;
   orderId?: string;
   invoiceDate: string;
   dueDate: string;
   totalAmount: number;
   amountPaid: number;
   balanceDue: number;
   stripeInvoiceId?: string;
   organizationClient: OrganizationClient;
   lineItems: InvoiceLineItem[];
   status: InvoiceStatus;
}

export enum InvoiceStatus {
   Draft = 0,
   Sent = 1,
   Paid = 2,
   Overdue = 3,
   Unpaid
}

export interface OrganizationClient {
   id: string;
   organizationId: string;
   organization: OrganizationDto
   firstName?: string;
   lastName?: string;
   address1?: string;
   address2?: string;
   city?: string;
   state?: string;
   zipCode?: string;
   phoneNumber?: string;
   emailAddress?: string;
}

export interface InvoiceLineItem {
   id: string;
   invoiceId: string;
   description: string;
   quantity: number;
   unitPrice: number;
   lineTotal: number;
}
