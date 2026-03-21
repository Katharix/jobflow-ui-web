import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from "../../../services/shared/base-api.service";
import {Client} from "../models/customer";

export interface CreateCustomerRequest {
   id?: string;
   firstName: string;
   lastName: string;
   emailAddress?: string;
   phoneNumber?: string;
   address1?: string;
   address2?: string;
   city?: string;
   state?: string;
   zipCode?: string;
}

export interface SendClientHubLinkRequest {
   recipientEmail: string;
   message?: string;
}

export interface SendClientHubLinkResponse {
   magicLink?: string;
}

@Injectable({providedIn: 'root'})
export class CustomersService {
   private api = inject(BaseApiService);

   private apiUrl = 'organization/clients/';

   createCustomer(
      payload: CreateCustomerRequest
   ): Observable<Client> {
      return this.api.post(
         `${this.apiUrl}upsert`,
         payload
      );
   }

   deleteClient(clientId: string): Observable<void> {
      return this.api.delete<void>(`${this.apiUrl}delete?clientId=${clientId}`);
   }

   getAllByOrganization(): Observable<Client[]> {
      return this.api.get(
         `${this.apiUrl}orgall`
      );
   }

   sendClientHubLink(clientId: string, request: SendClientHubLinkRequest): Observable<SendClientHubLinkResponse> {
      return this.api.post<SendClientHubLinkResponse>(`${this.apiUrl}${clientId}/send-client-hub-link`, request);
   }
}
