import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import {InvoiceService} from '../../../admin/invoices/services/invoice.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {Invoice, InvoiceStatus} from '../../../models/invoice';
import {PaymentProvider} from '../../../models/customer-payment-profile';
import {LucideAngularModule} from 'lucide-angular';
import {LoadingService} from '../../../services/shared/loading-service.service';
import {PaymentService} from "../../../services/shared/payment.service";
import {firstValueFrom} from "rxjs";
import {loadStripe, Stripe, StripeElements} from "@stripe/stripe-js";
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
   private invoiceService = inject(InvoiceService);
   private loadingService = inject(LoadingService);
   private route = inject(ActivatedRoute);
   private paymentService = inject(PaymentService);
   private router = inject(Router);

   InvoiceStatus = InvoiceStatus;
   PaymentProvider = PaymentProvider;
   invoice?: Invoice;
   loading = false;
   error: string | null = null;
   stripe!: Stripe;
   elements!: StripeElements;
   showPaymentForm = false;
   private returnToCommandCenter = false;
   organizationId: string | null = null;
   @ViewChild('paymentElementContainer') paymentElementContainer!: ElementRef;

   ngOnInit(): void {
      const invoiceId = this.route.snapshot.paramMap.get('id');
      this.returnToCommandCenter = this.route.snapshot.queryParamMap.get('returnTo') === 'dashboard-command-center';

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

   get paymentProvider(): PaymentProvider {
      return this.invoice?.paymentProvider ?? PaymentProvider.Stripe;
   }

   get paymentProviderLabel(): string {
      return this.paymentProvider === PaymentProvider.Square ? 'Square' : 'Stripe';
   }

   get payButtonLabel(): string {
      return this.paymentProvider === PaymentProvider.Square
         ? 'Pay with Square'
         : 'Pay Invoice';
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

         if (res.url && !res.clientSecret) {
            window.location.href = res.url;
            return;
         }

         if (!res.clientSecret) {
            this.error = 'Unable to initialize payment.';
            return;
         }

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
         if (this.returnToCommandCenter) {
            await this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
            return;
         }
      }

      this.loading = false;
   }

   cancelPayment(): void {
      if (this.returnToCommandCenter) {
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
         return;
      }

      this.showPaymentForm = false;
   }

}
