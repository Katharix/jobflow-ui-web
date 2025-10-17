import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import { Employee } from '../models/employee';


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'employees';

  constructor(private api: BaseApiService) {}

  getByOrganization(organizationId: string): Observable<Employee[]> {
    return this.api.get<Employee[]>(`${this.apiUrl}/organization/${organizationId}`);
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
}
