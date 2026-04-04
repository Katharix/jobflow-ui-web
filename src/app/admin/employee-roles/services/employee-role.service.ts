import { Injectable, inject } from '@angular/core';
import {Observable, shareReplay, tap} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {EmployeeRole, EmployeeRoleUsage} from '../models/employee-role';


@Injectable({
   providedIn: 'root'
})
export class EmployeeRoleService {
   private api = inject(BaseApiService);

   private apiUrl = 'employeeroles';
   private rolesByOrganization$?: Observable<EmployeeRole[]>;

   getByOrganization(): Observable<EmployeeRole[]> {
      if (!this.rolesByOrganization$) {
         this.rolesByOrganization$ = this.api
            .get<EmployeeRole[]>(`${this.apiUrl}/organization`)
            .pipe(shareReplay({ bufferSize: 1, refCount: true }));
      }

      return this.rolesByOrganization$;
   }

   getById(id: string): Observable<EmployeeRole> {
      return this.api.get<EmployeeRole>(`${this.apiUrl}/${id}`);
   }

   getUsageByOrganization(): Observable<EmployeeRoleUsage[]> {
      return this.api.get<EmployeeRoleUsage[]>(`${this.apiUrl}/organization/usage`);
   }

   create(payload: Partial<EmployeeRole>): Observable<EmployeeRole> {
      return this.api.post<EmployeeRole>(this.apiUrl, payload).pipe(
         tap(() => this.resetRoleCache())
      );
   }

   update(id: string, payload: Partial<EmployeeRole>): Observable<EmployeeRole> {
      return this.api.put<EmployeeRole>(`${this.apiUrl}/${id}`, payload).pipe(
         tap(() => this.resetRoleCache())
      );
   }

   delete(id: string): Observable<void> {
      return this.api.delete<void>(`${this.apiUrl}/${id}`).pipe(
         tap(() => this.resetRoleCache())
      );
   }

   private resetRoleCache(): void {
      this.rolesByOrganization$ = undefined;
   }
}
