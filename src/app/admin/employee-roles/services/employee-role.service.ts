import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {EmployeeRole, EmployeeRoleUsage} from '../models/employee-role';


@Injectable({
   providedIn: 'root'
})
export class EmployeeRoleService {
   private api = inject(BaseApiService);

   private apiUrl = 'employeeroles';

   getByOrganization(): Observable<EmployeeRole[]> {
      return this.api.get<EmployeeRole[]>(`${this.apiUrl}/organization`);
   }

   getById(id: string): Observable<EmployeeRole> {
      return this.api.get<EmployeeRole>(`${this.apiUrl}/${id}`);
   }

   getUsageByOrganization(): Observable<EmployeeRoleUsage[]> {
      return this.api.get<EmployeeRoleUsage[]>(`${this.apiUrl}/organization/usage`);
   }

   create(payload: Partial<EmployeeRole>): Observable<EmployeeRole> {
      return this.api.post<EmployeeRole>(this.apiUrl, payload);
   }

   update(id: string, payload: Partial<EmployeeRole>): Observable<EmployeeRole> {
      return this.api.put<EmployeeRole>(`${this.apiUrl}/${id}`, payload);
   }

   delete(id: string): Observable<void> {
      return this.api.delete<void>(`${this.apiUrl}/${id}`);
   }
}
