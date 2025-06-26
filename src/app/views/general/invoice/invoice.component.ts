import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../services/invoice.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../models/invoice';
import { LucideAngularModule } from 'lucide-angular';
import { LoadingService } from '../../../services/loading-service.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {

  invoice?: Invoice;

  constructor(
    private invoiceService: InvoiceService,
    private loadingService: LoadingService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');

    if (invoiceId) {
      console.log('Fetching invoice with ID:', invoiceId);
      this.invoiceService.getInvoice(invoiceId).subscribe({
        next: invoice => {
          this.invoice = invoice;
          console.log('✅ Invoice retrieved:', invoice);
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

}
