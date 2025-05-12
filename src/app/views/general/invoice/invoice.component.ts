import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../services/invoice.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../models/invoice';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {

  invoice?: Invoice;

  constructor(
    private invoiceService: InvoiceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');

    if (invoiceId) {
      this.invoiceService.getInvoice(invoiceId).subscribe({
        next: invoice => this.invoice = invoice,
        error: err => console.error('Invoice not found', err)
      });
    } else {
      console.warn('No invoice ID provided in route.');
    }
  }
}
