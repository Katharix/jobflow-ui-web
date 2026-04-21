import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from "../../../services/shared/base-api.service";
import {Client} from "../models/customer";
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import { CursorPagedResponse } from '../../../models/cursor-paged-response';

export interface ClientPagedQueryOptions {
   cursor?: string;
   pageSize?: number;
   missingEmailOnly?: boolean;
   search?: string;
   sortBy?: string;
   sortDirection?: 'asc' | 'desc';
}

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

export interface ClientImportPreviewResponse {
   uploadToken: string;
   sourceSystem: string;
   sourceColumns: string[];
   suggestedMappings: Record<string, string | null>;
   previewRows: Record<string, string | null>[];
   supportedTargetFields: string[];
   totalRows: number;
}

export interface StartClientImportRequest {
   uploadToken: string;
   sourceSystem?: string;
   columnMappings: Record<string, string | null>;
}

export interface StartClientImportResponse {
   jobId: string;
}

export interface ClientImportErrorItem {
   rowNumber: number;
   message: string;
}

export interface ClientImportJobStatusResponse {
   jobId: string;
   status: 'queued' | 'running' | 'completed' | 'failed';
   sourceSystem: string;
   totalRows: number;
   processedRows: number;
   succeededRows: number;
   failedRows: number;
   errorMessage?: string | null;
   errors: ClientImportErrorItem[];
}

@Injectable({providedIn: 'root'})
export class CustomersService {
   private api = inject(BaseApiService);
   private http = inject(HttpClient);

   private apiUrl = 'organization/clients/';
   private baseUrl = environment.apiUrl;

   createCustomer(
      payload: CreateCustomerRequest
   ): Observable<Client> {
      return this.api.post(
         `${this.apiUrl}upsert`,
         payload
      );
   }

   bulkCreateCustomers(payloads: CreateCustomerRequest[]): Observable<Client[]> {
      return this.api.post<Client[]>(`${this.apiUrl}upsert/multi`, payloads);
   }

   deleteClient(clientId: string): Observable<void> {
      return this.api.delete<void>(`${this.apiUrl}delete?clientId=${clientId}`);
   }

   getAllByOrganization(options?: { context?: import('@angular/common/http').HttpContext }): Observable<Client[]> {
      return this.api.get(
         `${this.apiUrl}orgall`, undefined, options?.context
      );
   }

   getAllByOrganizationPaged(options?: ClientPagedQueryOptions): Observable<CursorPagedResponse<Client>> {
      const params: Record<string, string> = {
         pageSize: `${options?.pageSize ?? 50}`,
      };

      if (options?.cursor) params['cursor'] = options.cursor;
      if (options?.missingEmailOnly) params['missingEmailOnly'] = 'true';
      if (options?.search) params['search'] = options.search;
      if (options?.sortBy) params['sortBy'] = options.sortBy;
      if (options?.sortDirection) params['sortDirection'] = options.sortDirection;

      return this.api.get<CursorPagedResponse<Client>>(`${this.apiUrl}orgall`, params);
   }

   sendClientHubLink(clientId: string, request: SendClientHubLinkRequest): Observable<SendClientHubLinkResponse> {
      return this.api.post<SendClientHubLinkResponse>(`${this.apiUrl}${clientId}/send-client-hub-link`, request);
   }

   previewClientImport(file: File, sourceSystem: string): Observable<ClientImportPreviewResponse> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceSystem', sourceSystem);

      return this.http.post<ClientImportPreviewResponse>(
         `${this.baseUrl}/${this.apiUrl}import/preview`,
         formData
      );
   }

   startClientImport(payload: StartClientImportRequest): Observable<StartClientImportResponse> {
      return this.api.post<StartClientImportResponse>(`${this.apiUrl}import/start`, payload);
   }

   getClientImportStatus(jobId: string): Observable<ClientImportJobStatusResponse> {
      return this.api.get<ClientImportJobStatusResponse>(`${this.apiUrl}import/jobs/${jobId}`);
   }

   downloadOrganizationDataJson(): Observable<Blob> {
      return this.api.getBlob('data-export/json');
   }

   downloadClientsCsv(): Observable<Blob> {
      return this.api.getBlob('data-export/clients.csv');
   }
}
