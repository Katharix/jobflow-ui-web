import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecurrenceRulesService } from './recurrence-rules.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { ScheduleType } from '../models/assignment';

describe('RecurrenceRulesService', () => {
  let service: RecurrenceRulesService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['put']);
    TestBed.configureTestingModule({
      providers: [
        RecurrenceRulesService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(RecurrenceRulesService);
  });

  it('upserts job recurrence with serialized dates', () => {
    const scheduledStart = new Date('2026-03-19T10:00:00.000Z');
    const scheduledEnd = new Date('2026-03-19T12:00:00.000Z');
    api.put.and.returnValue(of(void 0));

    service.upsertJobRecurrence('job-1', {
      scheduledStart,
      scheduledEnd,
      scheduleType: ScheduleType.Exact,
      recurrence: {
        pattern: 'Weekly',
        interval: 1,
        dayOfWeek: [1],
        startDate: scheduledStart,
        endType: 'Never'
      }
    }).subscribe();

    const [endpoint, body] = api.put.calls.mostRecent().args;
    expect(endpoint).toBe('job/job-1/recurrence');
    const request = body as { scheduledStart?: string; scheduledEnd?: string; pattern?: string };
    expect(request.scheduledStart).toBe(scheduledStart.toISOString());
    expect(request.scheduledEnd).toBe(scheduledEnd.toISOString());
    expect(request.pattern).toBe('Weekly');
  });
});
