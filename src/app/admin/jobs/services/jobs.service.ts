import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {Job} from "../models/job";

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
      payload: CreateJobRequest
   ): Observable<Job> {
      return this.api.post(
         `${this.apiUrl}upsert`,
         payload
      );
   }

   updateSchedule(
      payload: {
         id: string;
         scheduledStart: Date;
         scheduledEnd?: Date | null;
      }
   ) {
      return this.api.put(
         `${this.apiUrl}${payload.id}/schedule`,
         payload
      );
   }

   getAllJobs(): Observable<Job[]> {
      return this.api.get<any>(
         `${this.apiUrl}all`
      )
   }

   getScheduledJobs(start: Date, end: Date) {
      return this.api.get<any[]>(
         `${this.apiUrl}scheduled`,
         {start, end}
      );
   }


}
