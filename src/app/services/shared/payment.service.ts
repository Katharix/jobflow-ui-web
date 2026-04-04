import { Injectable, inject } from '@angular/core';
import {BaseApiService} from './base-api.service';
import {PaymentSessionRequest} from '../../models/payment-session-request';
import {Observable} from 'rxjs';
import { PaymentProvider } from '../../models/customer-payment-profile';

export interface LinkConnectedAccountRequest {
   accountId: string;
   provider: PaymentProvider;
}

export interface CheckoutPaymentResponse {
   clientSecret?: string;
   url?: string;
   providerPaymentId?: string;
   onboarding?: string;
}

export interface PaymentHistoryItem {
   id: string;
   eventType: string;
   status: string;
   paymentProvider: PaymentProvider;
   amountPaid: number;
   currency: string;
   paidAt: string;
   invoiceId?: string;
   stripePaymentIntentId?: string;
   subscriptionId?: string;
   customerId?: string;
}

export interface FinancialSummary {
   grossCollected: number;
   refunded: number;
   netCollected: number;
   monthCollected: number;
   outstanding: number;
   disputeCount: number;
   invoiceCount: number;
}

export interface CursorPagedResponse<T> {
   items: T[];
   nextCursor?: string | null;
}

export interface CurrentSubscription {
   providerSubscriptionId: string;
   providerPriceId: string;
   status: string;
   planName: string;
   startDate: string;
   canceledAt?: string;
}

export interface SubscriptionPlanPrice {
   planKey: string;
   cycle: string;
   providerPriceId: string;
   amount: number;
   currency: string;
}

export interface PaymentRefundRequest {
   provider: PaymentProvider;
   invoiceId: string;
   providerPaymentId: string;
   amount: number;
   currency?: string;
   reason?: string;
}

export interface ChangeSubscriptionPlanRequest {
   providerSubscriptionId: string;
   providerPriceId: string;
}

@Injectable({
   providedIn: 'root'
})
export class PaymentService {
   private api = inject(BaseApiService);

   paymentUrl: string;

   constructor() {
      this.paymentUrl = 'payments/';
   }

   createSubscriptionCheckout(paymentRequest: PaymentSessionRequest): Observable<CheckoutPaymentResponse> {
      return this.api.post<CheckoutPaymentResponse>(`${this.paymentUrl}checkout`, paymentRequest);
   }

   createInvoiceCheckoutSession(
      invoiceId: string
   ): Observable<{ url: string }> {
      return this.api.post<{ url: string }>(
         `${this.paymentUrl}checkout`,
         {
            invoiceId
         }
      );
   }

   createConnectedAccount(provider?: PaymentProvider): Observable<CheckoutPaymentResponse> {
      const endpoint = provider
         ? `${this.paymentUrl}create-connected-account?provider=${provider}`
         : `${this.paymentUrl}create-connected-account`;

      return this.api.post<CheckoutPaymentResponse>(endpoint, null);
   }

   linkConnectedAccount(request: LinkConnectedAccountRequest): Observable<{ linked: boolean }> {
      return this.api.post<{ linked: boolean }>(`${this.paymentUrl}link-connected-account`, request);
   }

   disconnectSquare(): Observable<{ disconnected: boolean }> {
      return this.api.delete<{ disconnected: boolean }>(`${this.paymentUrl}square/disconnect`);
   }

   createInvoicePaymentIntent(paymentSessionRequest: PaymentSessionRequest) {
      return this.api.post<CheckoutPaymentResponse>(
         `${this.paymentUrl}checkout`,
         paymentSessionRequest
      );
   }

   createDeposit(request: DepositPaymentRequest): Observable<CheckoutPaymentResponse> {
      return this.api.post<CheckoutPaymentResponse>(`${this.paymentUrl}deposit`, request);
   }

   getPaymentHistory(fromUtc?: string, toUtc?: string, cursor?: string, pageSize = 100): Observable<CursorPagedResponse<PaymentHistoryItem>> {
      const params: Record<string, string> = {};
      if (fromUtc) params['fromUtc'] = fromUtc;
      if (toUtc) params['toUtc'] = toUtc;
      if (cursor) params['cursor'] = cursor;
      params['pageSize'] = `${pageSize}`;
      return this.api.get<CursorPagedResponse<PaymentHistoryItem>>(`${this.paymentUrl}history`, params);
   }

   getDisputes(fromUtc?: string, toUtc?: string, cursor?: string, pageSize = 100): Observable<CursorPagedResponse<PaymentHistoryItem>> {
      const params: Record<string, string> = {};
      if (fromUtc) params['fromUtc'] = fromUtc;
      if (toUtc) params['toUtc'] = toUtc;
      if (cursor) params['cursor'] = cursor;
      params['pageSize'] = `${pageSize}`;
      return this.api.get<CursorPagedResponse<PaymentHistoryItem>>(`${this.paymentUrl}disputes`, params);
   }

   getFinancialSummary(): Observable<FinancialSummary> {
      return this.api.get<FinancialSummary>(`${this.paymentUrl}financial-summary`);
   }

   getCurrentSubscription(): Observable<CurrentSubscription> {
      return this.api.get<CurrentSubscription>(`${this.paymentUrl}subscription/current`);
   }

   getSubscriptionPlanPrices(): Observable<SubscriptionPlanPrice[]> {
      return this.api.get<SubscriptionPlanPrice[]>(`${this.paymentUrl}subscription/plans`);
   }

   cancelSubscription(providerSubscriptionId: string): Observable<void> {
      return this.api.post<void>(`${this.paymentUrl}subscription/cancel`, {
         providerSubscriptionId,
      });
   }

   changeSubscriptionPlan(request: ChangeSubscriptionPlanRequest): Observable<CheckoutPaymentResponse> {
      return this.api.post<CheckoutPaymentResponse>(`${this.paymentUrl}subscription/change-plan`, request);
   }

   refundPayment(request: PaymentRefundRequest): Observable<CheckoutPaymentResponse> {
      return this.api.post<CheckoutPaymentResponse>(`${this.paymentUrl}refund`, {
         currency: 'usd',
         ...request,
      });
   }
}

export interface DepositPaymentRequest {
   provider: PaymentProvider;
   organizationClientId: string;
   invoiceId?: string;
   productName?: string;
   amount: number;
}
