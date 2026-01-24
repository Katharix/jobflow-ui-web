import {Injectable} from '@angular/core';
import {BaseApiService} from './base-api.service';
import {PaymentSessionRequest} from '../models/payment-session-request';
import {Observable} from 'rxjs';

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

   // Method to create a one-time payment checkout session
   createInvoiceCheckoutSession(
      invoiceId: string
   ): Observable<{ url: string }> {
      return this.api.post(`${this.paymentUrl}invoice/${invoiceId}/checkout`, null);
   }


   createConnectedAccount(orgId: string): Observable<any> {
      return this.api.post(`${this.paymentUrl}${orgId}/create-connected-account`, null);
   }

   createInvoicePaymentIntent(paymentSessionRequest: PaymentSessionRequest) {
      return this.api.post<{ clientSecret: string }>(
         `${this.paymentUrl}checkout`,
         paymentSessionRequest
      );
   }

}
