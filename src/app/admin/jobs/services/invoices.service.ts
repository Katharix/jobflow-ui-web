import { Injectable } from '@angular/core';
import { CreateInvoiceRequest, Invoice } from '../../../models/invoice';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
   constructor(private invoiceService: InvoiceService) {}

   createInvoice(organizationId: string, request: CreateInvoiceRequest): Observable<Invoice> {
      return this.invoiceService.create(organizationId, request);
   }

   sendInvoice(invoiceId: string): Observable<void> {
      return this.invoiceService.sendInvoice(invoiceId);
   }
}
