import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/shared/base-api.service';

export interface StartDataExportJobResponse {
  jobId: string;
}

export interface DataExportJobStatusResponse {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  errorMessage?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;
  expiresAtUtc?: string | null;
  downloadCount: number;
}

@Injectable({ providedIn: 'root' })
export class DataExportService {
  private api = inject(BaseApiService);

  startDataExportJob(): Observable<StartDataExportJobResponse> {
    return this.api.post<StartDataExportJobResponse>('data-export/jobs', {});
  }

  getDataExportJobStatus(jobId: string): Observable<DataExportJobStatusResponse> {
    return this.api.get<DataExportJobStatusResponse>(`data-export/jobs/${jobId}`);
  }

  getDataExportJobs(): Observable<DataExportJobStatusResponse[]> {
    return this.api.get<DataExportJobStatusResponse[]>('data-export/jobs');
  }

  downloadDataExportJob(jobId: string): Observable<Blob> {
    return this.api.getBlob(`data-export/jobs/${jobId}/download`);
  }

  downloadOrganizationDataJson(): Observable<Blob> {
    return this.api.getBlob('data-export/json');
  }

  downloadClientsCsv(): Observable<Blob> {
    return this.api.getBlob('data-export/clients.csv');
  }
}
