import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/base-api.service';
import {EmployeeInvite} from '../models/employee-invite';

@Injectable({
   providedIn: 'root'
})
export class EmployeeInviteService {
   private apiUrl = 'employeeinvite'; // Matches your backend controller route

   constructor(private api: BaseApiService) {
   }

   /**
    * Send an invite to a new employee.
    * Backend will handle token generation and notifications.
    */
   sendInvite(invite: Partial<EmployeeInvite>): Observable<EmployeeInvite> {
      return this.api.post<EmployeeInvite>(this.apiUrl, invite);
   }

   /**
    * Get all invites for the current organization.
    */
   getByOrganization(): Observable<EmployeeInvite[]> {
      return this.api.get<EmployeeInvite[]>(`${this.apiUrl}/organization`);
   }

   /**
    * Accept an invite using its token.
    */
   accept(token: string): Observable<void> {
      return this.api.post<void>(`${this.apiUrl}/accept/${token}`, {});
   }

   /**
    * Revoke an existing invite.
    */
   revoke(inviteId: string): Observable<void> {
      return this.api.post<void>(`${this.apiUrl}/revoke/${inviteId}`, {});
   }
}
