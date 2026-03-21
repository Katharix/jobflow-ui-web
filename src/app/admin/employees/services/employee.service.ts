import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {Employee} from '../models/employee';


@Injectable({
   providedIn: 'root'
})
export class EmployeeService {
   private api = inject(BaseApiService);

   private apiUrl = 'employees';

   getByOrganization(): Observable<Employee[]> {
      return this.api.get<Employee[]>(`${this.apiUrl}/organization`);
   }

   getById(employeeId: string): Observable<Employee> {
      return this.api.get<Employee>(`${this.apiUrl}/${employeeId}`);
   }

   create(payload: Partial<Employee>): Observable<Employee> {
      return this.api.post<Employee>(this.apiUrl, payload);
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
}
