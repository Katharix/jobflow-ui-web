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

   createInvoicePaymentIntent(paymentSessionRequest: PaymentSessionRequest) {
      return this.api.post<CheckoutPaymentResponse>(
         `${this.paymentUrl}checkout`,
         paymentSessionRequest
      );
   }
}
