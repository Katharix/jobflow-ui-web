import {of} from 'rxjs';
import {JobsService} from './jobs.service';
import {BaseApiService} from '../../../services/shared/base-api.service';

describe('JobsService', () => {
   let service: JobsService;
   let apiSpy: jasmine.SpyObj<BaseApiService>;

   beforeEach(() => {
      apiSpy = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put']);
      service = new JobsService(apiSpy);
   });

   it('posts job payload to upsert endpoint', () => {
      const payload = {organizationClientId: 'client-1', title: 'Spring Cleanup'};
      apiSpy.post.and.returnValue(of({id: 'job-1'} as any));

      service.upsertJob(payload).subscribe();

      expect(apiSpy.post).toHaveBeenCalledWith('job/upsert', payload);
   });

   it('puts schedule payload to schedule endpoint', () => {
      const payload = {
         id: 'job-1',
         scheduledStart: new Date('2026-03-12T12:00:00.000Z'),
         scheduledEnd: new Date('2026-03-12T14:00:00.000Z')
      };
      apiSpy.put.and.returnValue(of({}));

      service.updateSchedule(payload).subscribe();

      expect(apiSpy.put).toHaveBeenCalledWith('job/job-1/schedule', payload);
   });

   it('gets all jobs from all endpoint', () => {
      apiSpy.get.and.returnValue(of([]));

      service.getAllJobs().subscribe();

      expect(apiSpy.get).toHaveBeenCalledWith('job/all');
   });

   it('gets scheduled jobs with start/end query params', () => {
      const start = new Date('2026-03-12T00:00:00.000Z');
      const end = new Date('2026-03-13T00:00:00.000Z');
      apiSpy.get.and.returnValue(of([]));

      service.getScheduledJobs(start, end).subscribe();

      expect(apiSpy.get).toHaveBeenCalledWith('job/scheduled', {start, end});
   });
});