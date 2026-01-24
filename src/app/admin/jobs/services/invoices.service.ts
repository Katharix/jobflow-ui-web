import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../services/base-api.service';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
   private apiUrl = 'invoice/';

   constructor(private api: BaseApiService) {}

   createInvoice(organizationId: string, payload: any) {
      return this.api.post(
         `${this.apiUrl}${organizationId}`,
         payload
      );
   }
   sendInvoice(invoiceId: string) {
      return this.api.post(`invoice/${invoiceId}/send`, {});
   }
}
