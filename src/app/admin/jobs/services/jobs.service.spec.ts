import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { JobsService } from './jobs.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { Job } from '../models/job';

describe('JobsService', () => {
  let service: JobsService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [
        JobsService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(JobsService);
  });

  it('requests all jobs', () => {
    api.get.and.returnValue(of([]));
    service.getAllJobs().subscribe();
    expect(api.get).toHaveBeenCalledWith('job/all');
  });

  it('updates schedule via schedule endpoint', () => {
    api.put.and.returnValue(of({} as Job));
    const payload = {
      id: 'job-1',
      scheduledStart: new Date('2026-03-19T10:00:00.000Z'),
      scheduledEnd: new Date('2026-03-19T12:00:00.000Z')
    };
    service.updateSchedule(payload).subscribe();
    expect(api.put).toHaveBeenCalledWith('job/job-1/schedule', payload);
  });
});