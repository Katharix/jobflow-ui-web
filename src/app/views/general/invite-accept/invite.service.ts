import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Employee } from '../../../admin/employees/models/employee';

export interface InviteInfo {
    firstName: string;
    lastName: string;
    email: string;
    inviteToken: string;
    organizationName: string;
    roleName: string;
}

@Injectable({ providedIn: 'root' })
export class InviteService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/employeeinvite`;

    getInviteByCode(code: string): Observable<InviteInfo> {
        return this.http.get<InviteInfo>(`${this.baseUrl}/${code}`);
    }

    acceptInvite(inviteToken: string): Observable<Employee> {
        return this.http.post<Employee>(`${this.baseUrl}/accept/${inviteToken}`, {});
    }
}
