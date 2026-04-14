import { Injectable, inject } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { CreateInvoiceRequest, Invoice } from '../../../models/invoice';
import { Observable } from 'rxjs';
import { CursorPagedResponse } from '../../../models/cursor-paged-response';

export interface InvoicePagedQueryOptions {
  cursor?: string;
  pageSize?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface InvoiceSummaryDto {
  invoiceCount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  refundedCount: number;
  totalBilled: number;
  balanceDue: number;
  outstanding: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private api = inject(BaseApiService);

  private readonly invoiceUrl = 'invoice/';

  getByOrganization(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`${this.invoiceUrl}organization`);
  }

  getByOrganizationPaged(options?: InvoicePagedQueryOptions): Observable<CursorPagedResponse<Invoice>> {
    const params: Record<string, string> = {
      pageSize: `${options?.pageSize ?? 50}`,
    };

    if (options?.cursor) params['cursor'] = options.cursor;
    if (options?.status) params['status'] = options.status;
    if (options?.search) params['search'] = options.search;
    if (options?.sortBy) params['sortBy'] = options.sortBy;
    if (options?.sortDirection) params['sortDirection'] = options.sortDirection;

    return this.api.get<CursorPagedResponse<Invoice>>(`${this.invoiceUrl}organization`, params);
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

  getSummary(): Observable<InvoiceSummaryDto> {
    return this.api.get<InvoiceSummaryDto>(`${this.invoiceUrl}organization/summary`);
  }
}
