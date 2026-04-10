import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { JobTemplate } from '../models/job-template';

@Injectable({
  providedIn: 'root'
})
export class JobTemplateService {
  private api = inject(BaseApiService);
  private apiUrl = 'jobtemplates';

  getByOrganization(): Observable<JobTemplate[]> {
    return this.api.get<JobTemplate[]>(`${this.apiUrl}/organization`);
  }

  getById(id: string): Observable<JobTemplate> {
    return this.api.get<JobTemplate>(`${this.apiUrl}/${id}`);
  }

  create(payload: Partial<JobTemplate>): Observable<JobTemplate> {
    return this.api.post<JobTemplate>(this.apiUrl, payload);
  }

  update(id: string, payload: Partial<JobTemplate>): Observable<JobTemplate> {
    return this.api.put<JobTemplate>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/${id}`);
  }
}
