import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {Job, JobLifecycleStatus, InvoicingWorkflow} from "../models/job";

export interface CreateJobRequest {
   organizationClientId: string;
   title: string;
   invoicingWorkflow?: InvoicingWorkflow | null;
}

export interface JobUpsertRequest {
   id?: string;
   organizationClientId: string;
   title: string;
   comments?: string;
   lifecycleStatus?: JobLifecycleStatus;
   invoicingWorkflow?: InvoicingWorkflow | null;
}

@Injectable({providedIn: 'root'})
export class JobsService {
   private api = inject(BaseApiService);

   private apiUrl = 'job/';

   upsertJob(
      payload: CreateJobRequest | JobUpsertRequest
   ): Observable<Job> {
      return this.api.post(
         `${this.apiUrl}upsert`,
         payload
      );
   }

   updateJobStatus(jobId: string, status: JobLifecycleStatus): Observable<Job> {
      return this.api.put(
         `${this.apiUrl}${jobId}/status`,
         { status }
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

   getById(id: string): Observable<Job> {
      return this.api.get<Job>(`${this.apiUrl}${id}`);
   }

   getAllJobs(): Observable<Job[]> {
      return this.api.get<Job[]>(
         `${this.apiUrl}all`
      )
   }

   getScheduledJobs(start: Date, end: Date): Observable<Job[]> {
      return this.api.get<Job[]>(
         `${this.apiUrl}scheduled`,
         {start, end}
      );
   }


}
