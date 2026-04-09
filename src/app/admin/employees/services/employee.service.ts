import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Employee} from '../models/employee';

export interface EmployeeImportPreviewResponse {
   uploadToken: string;
   sourceSystem: string;
   sourceColumns: string[];
   suggestedMappings: Record<string, string | null>;
   previewRows: Record<string, string | null>[];
   supportedTargetFields: string[];
   totalRows: number;
}

export interface StartEmployeeImportRequest {
   uploadToken: string;
   sourceSystem?: string;
   columnMappings: Record<string, string | null>;
}

export interface StartEmployeeImportResponse {
   jobId: string;
}

export interface EmployeeImportErrorItem {
   rowNumber: number;
   message: string;
}

export interface EmployeeImportJobStatusResponse {
   jobId: string;
   status: 'queued' | 'running' | 'completed' | 'failed';
   sourceSystem: string;
   totalRows: number;
   processedRows: number;
   succeededRows: number;
   failedRows: number;
   errorMessage?: string | null;
   errors: EmployeeImportErrorItem[];
}

@Injectable({
   providedIn: 'root'
})
export class EmployeeService {
   private api = inject(BaseApiService);
   private http = inject(HttpClient);

   private apiUrl = 'employees';
   private baseUrl = environment.apiUrl;

   getByOrganization(): Observable<Employee[]> {
      return this.api.get<Employee[]>(`${this.apiUrl}/organization`);
   }

   getById(employeeId: string): Observable<Employee> {
      return this.api.get<Employee>(`${this.apiUrl}/${employeeId}`);
   }

   create(payload: Partial<Employee>): Observable<Employee> {
      return this.api.post<Employee>(this.apiUrl, payload);
   }

   bulkCreate(payloads: Partial<Employee>[]): Observable<Employee[]> {
      return this.api.post<Employee[]>(`${this.apiUrl}/bulk`, payloads);
   }

   update(employeeId: string, payload: Partial<Employee>): Observable<Employee> {
      return this.api.put<Employee>(`${this.apiUrl}/${employeeId}`, payload);
   }

   delete(employeeId: string): Observable<void> {
      return this.api.delete<void>(`${this.apiUrl}/${employeeId}`);
   }

   employeeExistByEmail(email: string): Observable<boolean> {
      return this.api.get<boolean>(`${this.apiUrl}/email/${email}`);
   }

   previewEmployeeImport(file: File, sourceSystem: string): Observable<EmployeeImportPreviewResponse> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceSystem', sourceSystem);

      return this.http.post<EmployeeImportPreviewResponse>(
         `${this.baseUrl}/${this.apiUrl}/import/preview`,
         formData
      );
   }

   startEmployeeImport(payload: StartEmployeeImportRequest): Observable<StartEmployeeImportResponse> {
      return this.api.post<StartEmployeeImportResponse>(`${this.apiUrl}/import/start`, payload);
   }

   getEmployeeImportStatus(jobId: string): Observable<EmployeeImportJobStatusResponse> {
      return this.api.get<EmployeeImportJobStatusResponse>(`${this.apiUrl}/import/jobs/${jobId}`);
   }
}
