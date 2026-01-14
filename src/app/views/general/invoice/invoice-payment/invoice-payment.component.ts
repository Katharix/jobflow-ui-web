import {Component, Input, OnInit} from '@angular/core';
import {loadStripe, Stripe, StripeElements} from '@stripe/stripe-js';
import {PaymentService} from "../../../../services/payment.service";
import {firstValueFrom} from "rxjs";

@Component({
   selector: 'jobflow-invoice-payment',
   standalone: true,
   templateUrl: './invoice-payment.component.html'
})
export class InvoicePaymentComponent implements OnInit {

   @Input() invoiceId!: string;

   stripe!: Stripe;
   elements!: StripeElements;
   clientSecret!: string;

   loading = false;
   error?: string;

   constructor(private paymentService: PaymentService) {
   }

   async ngOnInit() {
      this.loading = true;

      const res = await firstValueFrom(
         this.paymentService.createInvoicePaymentIntent(this.invoiceId)
      );

      this.clientSecret = res.clientSecret;

      this.stripe = await loadStripe('pk_test_XXXX') as Stripe;

      this.elements = this.stripe.elements({
         clientSecret: this.clientSecret
      });

      const paymentElement = this.elements.create('payment');
      paymentElement.mount('#payment-element');

      this.loading = false;
   }


   async pay() {
      this.loading = true;
      this.error = undefined;

      const {error} = await this.stripe.confirmPayment({
         elements: this.elements,
         confirmParams: {
            return_url: window.location.href
         }
      });

      if (error) {
         this.error = error.message;
         this.loading = false;
      }
   }
}
