import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {Job, JobLifecycleStatus, InvoicingWorkflow} from "../models/job";
import { CursorPagedResponse } from '../../../models/cursor-paged-response';

export interface JobPagedQueryOptions {
   cursor?: string;
   pageSize?: number;
   statusKey?: string;
   clientId?: string;
   assigneeId?: string;
   search?: string;
   sortBy?: string;
   sortDirection?: 'asc' | 'desc';
}

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

   getAllJobsPaged(options?: JobPagedQueryOptions): Observable<CursorPagedResponse<Job>> {
      const params: Record<string, string> = {
         pageSize: `${options?.pageSize ?? 50}`,
      };

      if (options?.cursor) params['cursor'] = options.cursor;
      if (options?.statusKey) params['statusKey'] = options.statusKey;
      if (options?.clientId) params['clientId'] = options.clientId;
      if (options?.assigneeId) params['assigneeId'] = options.assigneeId;
      if (options?.search) params['search'] = options.search;
      if (options?.sortBy) params['sortBy'] = options.sortBy;
      if (options?.sortDirection) params['sortDirection'] = options.sortDirection;

      return this.api.get<CursorPagedResponse<Job>>(
         `${this.apiUrl}all`,
         params
      );
   }

   getScheduledJobs(start: Date, end: Date): Observable<Job[]> {
      return this.api.get<Job[]>(
         `${this.apiUrl}scheduled`,
         {start, end}
      );
   }


}
