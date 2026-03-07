import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecurrenceRuleUpsertRequest } from '../models/recurrence-rule';
import { environment } from '../../../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class RecurrenceRulesService {
  private readonly baseUrl = `${environment.baseUrl}/job`;

  constructor(private http: HttpClient) {}

  upsertJobRecurrence(
    jobId: string,
    body: RecurrenceRuleUpsertRequest
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${jobId}/recurrence`, body);
  }
}