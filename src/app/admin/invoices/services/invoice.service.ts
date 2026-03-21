import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { CreateInvoiceRequest, Invoice } from '../../../models/invoice';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly invoiceUrl = 'invoice/';

  constructor(private api: BaseApiService) {}

  getByOrganization(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`${this.invoiceUrl}organization`);
  }

  getByClient(clientId: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`${this.invoiceUrl}client/${clientId}`);
  }

  getInvoice(id: string): Observable<Invoice> {
    return this.api.get<Invoice>(`${this.invoiceUrl}${id}`);
  }

  create(organizationId: string, request: CreateInvoiceRequest): Observable<Invoice> {
    return this.api.post<Invoice>(`${this.invoiceUrl}${organizationId}`, request);
  }

  upsertForOrganization(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.api.post<Invoice>(`${this.invoiceUrl}organization`, request);
  }

  sendInvoice(invoiceId: string): Observable<void> {
    return this.api.post<void>(`${this.invoiceUrl}${invoiceId}/send`, {});
  }

  sendReminder(invoiceId: string): Observable<void> {
    return this.api.post<void>(`${this.invoiceUrl}${invoiceId}/remind`, {});
  }

  deleteInvoice(id: string): Observable<void> {
    return this.api.delete<void>(`${this.invoiceUrl}${id}`);
  }

  getPdf(id: string): Observable<Blob> {
    return this.api.getBlob(`${this.invoiceUrl}${id}/pdf`);
  }
}
