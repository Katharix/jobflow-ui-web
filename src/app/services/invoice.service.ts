import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Invoice } from '../models/invoice';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
invoiceUrl: string;
  constructor(private api: BaseApiService) { 
    this.invoiceUrl = 'invoice/';
  }

   getInvoice(id: string): Observable<Invoice> {
    return this.api.get<Invoice>(`${this.invoiceUrl}${id}`);
  }
}
