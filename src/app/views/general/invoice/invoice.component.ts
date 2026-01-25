import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {InvoiceService} from '../../../services/invoice.service';
import {ActivatedRoute} from '@angular/router';
import {CommonModule} from '@angular/common';
import {Invoice, InvoiceStatus} from '../../../models/invoice';
import {LucideAngularModule} from 'lucide-angular';
import {LoadingService} from '../../../services/loading-service.service';
import {PaymentService} from "../../../services/payment.service";
import {firstValueFrom} from "rxjs";
import {loadStripe, Stripe, StripeElements} from "@stripe/stripe-js";
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {OrganizationDto} from "../../../models/organization";
import {PaymentSessionRequest} from "../../../models/payment-session-request";
import {environment} from "../../../../environments/environment";

@Component({
   selector: 'app-invoice',
   standalone: true,
   imports: [CommonModule, LucideAngularModule],
   templateUrl: './invoice.component.html',
   styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
   InvoiceStatus = InvoiceStatus;
   invoice?: Invoice;
   loading = false;
   error: string | null = null;
   stripe!: Stripe;
   elements!: StripeElements;
   showPaymentForm = false;
   organizationId: string | null = null;
   org: OrganizationDto;
   @ViewChild('paymentElementContainer') paymentElementContainer!: ElementRef;


   constructor(
      private invoiceService: InvoiceService,
      private loadingService: LoadingService,
      private route: ActivatedRoute,
      private paymentService: PaymentService,
   ) {
   }

   ngOnInit(): void {
      const invoiceId = this.route.snapshot.paramMap.get('id');

      if (invoiceId) {
         this.invoiceService.getInvoice(invoiceId).subscribe({
            next: invoice => {
               this.invoice = invoice;
               this.organizationId = invoice.organizationId;
            },
            error: err => {
               console.error('❌ Failed to retrieve invoice:', err);
            }
         });
      } else {
         console.warn('⚠️ No invoice ID provided in route.');
      }
   }

   get subTotal(): number {
      return this.invoice?.lineItems?.reduce((sum, item) => {
         return sum + (item.quantity * item.unitPrice);
      }, 0) || 0;
   }

   get taxRate(): number {
      return this.invoice?.organizationClient?.organization?.defaultTaxRate || 0;
   }

   get taxAmount(): number {
      return this.subTotal * this.taxRate;
   }

   get total(): number {
      return this.subTotal + this.taxAmount;
   }

   get balanceDue(): number {
      return this.total - (this.invoice?.amountPaid || 0);
   }

   async payInvoice(): Promise<void> {
      if (!this.invoice?.id) return;

      this.loading = true;
      this.error = null;

      try {
         // 1. Create PaymentIntent (API you already have)
         const paymentSessionRequest: PaymentSessionRequest = {
            invoiceId: this.invoice.id,
            orgId: this.organizationId!,
            amount: this.invoice.balanceDue,
         }
         const res = await firstValueFrom(
            this.paymentService.createInvoicePaymentIntent(paymentSessionRequest)
         );

         // 2. Load Stripe
         this.stripe = await loadStripe(environment.stripePublicKey) as Stripe;

         // 3. Create Elements
         this.elements = this.stripe.elements({
            clientSecret: res.clientSecret
         });

         // 4. Mount Payment Element
         this.showPaymentForm = true;
         setTimeout(() => {
            const paymentElement = this.elements.create('payment');
            paymentElement.mount(this.paymentElementContainer.nativeElement);
         });

      } catch {
         this.error = 'Unable to initialize payment.';
      } finally {
         this.loading = false;
      }
   }

   async confirmPayment(): Promise<void> {
      if (!this.stripe || !this.elements) return;

      this.loading = true;
      this.error = null;

      const result = await this.stripe.confirmPayment({
         elements: this.elements,
         redirect: 'if_required'
      });

      if (result.error) {
         this.error = result.error.message ?? 'Payment failed.';
         this.loading = false;
         return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
         // UI cleanup will go here next
      }

      this.loading = false;
   }

}
