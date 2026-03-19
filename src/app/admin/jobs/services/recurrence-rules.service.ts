import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecurrenceRuleUpsertRequest } from '../models/recurrence-rule';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { ScheduleType } from '../models/assignment';

@Injectable({ providedIn: 'root' })
export class RecurrenceRulesService {
  private readonly baseUrl = 'job';

  constructor(private api: BaseApiService) {}

  upsertJobRecurrence(
    jobId: string,
    payload: {
      scheduledStart: Date;
      scheduledEnd: Date;
      scheduleType: ScheduleType;
      recurrence: RecurrenceRuleUpsertRequest;
    }
  ): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${jobId}/recurrence`, {
      scheduledStart: payload.scheduledStart?.toISOString(),
      scheduledEnd: payload.scheduledEnd?.toISOString(),
      scheduleType: payload.scheduleType,
      ...payload.recurrence,
    });
  }
}