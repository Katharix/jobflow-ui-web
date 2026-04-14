import {OrganizationDto} from "./organization";
import {PaymentProvider} from "./customer-payment-profile";

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
   amountRefunded: number;
   balanceDue: number;
   stripeInvoiceId?: string;
   paymentProvider?: PaymentProvider;
   externalPaymentId?: string;
   paidAt?: string;
   organizationClient: OrganizationClient;
   lineItems: InvoiceLineItem[];
   status: InvoiceStatus;
}

export enum InvoiceStatus {
   Draft = 0,
   Sent = 1,
   Paid = 2,
   Overdue = 3,
   Unpaid,
   Refunded
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
   priceBookItemId?: string;
   description: string;
   quantity: number;
   unitPrice: number;
   lineTotal: number;
}

export interface CreateInvoiceLineItemRequest {
   priceBookItemId?: string;
   description: string;
   quantity: number;
   unitPrice: number;
}

export interface CreateInvoiceRequest {
   jobId: string;
   invoiceDate?: string;
   dueDate?: string;
   lineItems: CreateInvoiceLineItemRequest[];
}
