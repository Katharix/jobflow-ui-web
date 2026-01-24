import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/base-api.service';

export interface CreateJobRequest {
   organizationClientId: string;
   title: string;
}

@Injectable({providedIn: 'root'})
export class JobsService {
   private apiUrl = 'job/';

   constructor(private api: BaseApiService) {
   }

   upsertJob(
      organizationId: string,
      payload: CreateJobRequest
   ): Observable<any> {
      return this.api.post(
         `${this.apiUrl}${organizationId}`,
         payload
      );
   }

   updateSchedule(
      organizationId: string,
      payload: {
         id: string;
         scheduledStart: string;
         scheduledEnd?: string | null;
      }
   ) {
      return this.api.post(
         `${this.apiUrl}${organizationId}`,
         payload
      );
   }

   getAllJobs() {
      return this.api.get<any>(
         `${this.apiUrl}all`
      )
   }
}
