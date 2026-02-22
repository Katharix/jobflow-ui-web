import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from "../../../services/base-api.service";

export interface CreateCustomerRequest {
   firstName: string;
   lastName: string;
   emailAddress?: string;
   phoneNumber?: string;
}

@Injectable({providedIn: 'root'})
export class CustomersService {
   private apiUrl = 'organization/clients/';

   constructor(private api: BaseApiService) {
   }

   createCustomer(
      payload: CreateCustomerRequest
   ): Observable<any> {
      return this.api.post(
         `${this.apiUrl}upsert`,
         payload
      );
   }

   getAllByOrganization(): Observable<any[]> {
      return this.api.get(
         `${this.apiUrl}orgall`
      );
   }
}
