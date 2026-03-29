import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { EmployeeRolePreset, EmployeeRolePresetApplyResult } from '../models/employee-role-preset';

@Injectable({
  providedIn: 'root'
})
export class EmployeeRolePresetService {
  private api = inject(BaseApiService);
  private apiUrl = 'employeerolepresets';

  getByOrganization(): Observable<EmployeeRolePreset[]> {
    return this.api.get<EmployeeRolePreset[]>(`${this.apiUrl}/organization`);
  }

  getById(id: string): Observable<EmployeeRolePreset> {
    return this.api.get<EmployeeRolePreset>(`${this.apiUrl}/${id}`);
  }

  create(payload: Partial<EmployeeRolePreset>): Observable<EmployeeRolePreset> {
    return this.api.post<EmployeeRolePreset>(this.apiUrl, payload);
  }

  update(id: string, payload: Partial<EmployeeRolePreset>): Observable<EmployeeRolePreset> {
    return this.api.put<EmployeeRolePreset>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/${id}`);
  }

  applyPreset(id: string, overwriteExisting = true): Observable<EmployeeRolePresetApplyResult> {
    return this.api.post<EmployeeRolePresetApplyResult>(
      `${this.apiUrl}/${id}/apply?overwriteExisting=${overwriteExisting}`,
      {}
    );
  }
}
