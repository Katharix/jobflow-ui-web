import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { AssignmentsService } from './assignments.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { ScheduleType } from '../models/assignment';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);
    TestBed.configureTestingModule({
      providers: [
        AssignmentsService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(AssignmentsService);
  });

  it('builds query params for getAssignments', () => {
    const start = new Date('2026-03-19T10:00:00.000Z');
    const end = new Date('2026-03-19T12:00:00.000Z');
    api.get.and.returnValue(of([]));

    service.getAssignments(start, end).subscribe();

    const args = api.get.calls.mostRecent().args;
    expect(args[0]).toBe('assignment');
    const params = args[1] as HttpParams;
    expect(params.get('start')).toBe(start.toISOString());
    expect(params.get('end')).toBe(end.toISOString());
  });

  it('serializes dates when creating assignment', () => {
    const scheduledStart = new Date('2026-03-19T10:00:00.000Z');
    const scheduledEnd = new Date('2026-03-19T12:00:00.000Z');
    api.post.and.returnValue(of({} as any));

    service.createAssignment('job-1', {
      scheduledStart,
      scheduledEnd,
      scheduleType: ScheduleType.Exact
    }).subscribe();

    const [, body] = api.post.calls.mostRecent().args;
    expect(body.scheduledStart).toBe(scheduledStart.toISOString());
    expect(body.scheduledEnd).toBe(scheduledEnd.toISOString());
  });

  it('serializes dates when updating assignment schedule', () => {
    const scheduledStart = new Date('2026-03-19T10:00:00.000Z');
    const scheduledEnd = new Date('2026-03-19T12:00:00.000Z');
    api.put.and.returnValue(of({} as any));

    service.updateAssignmentSchedule('assignment-1', {
      scheduledStart,
      scheduledEnd,
      scheduleType: ScheduleType.Exact
    }).subscribe();

    const [endpoint, body] = api.put.calls.mostRecent().args;
    expect(endpoint).toBe('assignment/assignment-1/schedule');
    expect(body.scheduledStart).toBe(scheduledStart.toISOString());
    expect(body.scheduledEnd).toBe(scheduledEnd.toISOString());
  });
});
