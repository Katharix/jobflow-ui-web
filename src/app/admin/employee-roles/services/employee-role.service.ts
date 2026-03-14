import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {EmployeeRole} from '../models/employee-role';


@Injectable({
   providedIn: 'root'
})
export class EmployeeRoleService {
   private apiUrl = 'employeeroles';

   constructor(private api: BaseApiService) {
   }

   getByOrganization(): Observable<EmployeeRole[]> {
      return this.api.get<EmployeeRole[]>(`${this.apiUrl}/organization`);
   }

   getById(id: string): Observable<EmployeeRole> {
      return this.api.get<EmployeeRole>(`${this.apiUrl}/${id}`);
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
