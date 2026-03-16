import {Injectable} from '@angular/core';
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
   paymentUrl: string;

   constructor(private api: BaseApiService) {
      this.paymentUrl = 'payments/';
   }

   createSubscriptionCheckout(paymentRequest: PaymentSessionRequest): Observable<any> {
      return this.api.post(`${this.paymentUrl}checkout`, paymentRequest);
   }

   createInvoiceCheckoutSession(
      invoiceId: string
   ): Observable<{ url: string }> {
      return this.api.post(`${this.paymentUrl}invoice/${invoiceId}/checkout`, null);
   }

   createConnectedAccount(provider?: PaymentProvider): Observable<any> {
      const endpoint = provider
         ? `${this.paymentUrl}create-connected-account?provider=${provider}`
         : `${this.paymentUrl}create-connected-account`;

      return this.api.post(endpoint, null);
   }

   linkConnectedAccount(orgId: string, request: LinkConnectedAccountRequest): Observable<{ linked: boolean }> {
      return this.api.post<{ linked: boolean }>(`${this.paymentUrl}${orgId}/link-connected-account`, request);
   }

   createInvoicePaymentIntent(paymentSessionRequest: PaymentSessionRequest) {
      return this.api.post<CheckoutPaymentResponse>(
         `${this.paymentUrl}checkout`,
         paymentSessionRequest
      );
   }
}
