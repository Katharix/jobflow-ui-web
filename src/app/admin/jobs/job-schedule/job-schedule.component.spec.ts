import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { JobScheduleComponent } from './job-schedule.component';
import { AssignmentsService } from '../services/assignments.service';
import { JobsService } from '../services/jobs.service';
import { RecurrenceRulesService } from '../services/recurrence-rules.service';
import { AssignmentDto, ScheduleType } from '../models/assignment';
import { Job } from '../models/job';

describe('JobScheduleComponent', () => {
   let assignmentsSpy: jasmine.SpyObj<AssignmentsService>;
   let recurrenceRulesSpy: jasmine.SpyObj<RecurrenceRulesService>;
   let jobsSpy: jasmine.SpyObj<JobsService>;
   let routerSpy: jasmine.SpyObj<Router>;
   let component: JobScheduleComponent;

   const stubJob: Job = {
      id: 'job-1',
      title: 'Spring Cleanup',
      scheduledStart: new Date('2026-03-14T00:00:00.000Z'),
      scheduledEnd: new Date('2026-03-14T01:00:00.000Z'),
      organizationClient: {
         id: 'client-1',
         organizationId: 'org-1',
         organization: {} as any,
         firstName: 'Jane',
         lastName: 'Smith'
      },
      lifecycleStatus: 1,
      hasAssignments: false
   };

   beforeEach(() => {
      assignmentsSpy = jasmine.createSpyObj<AssignmentsService>('AssignmentsService', [
         'getAssignments',
         'createAssignment',
         'updateAssignmentSchedule'
      ]);
      recurrenceRulesSpy = jasmine.createSpyObj<RecurrenceRulesService>('RecurrenceRulesService', [
         'upsertJobRecurrence'
      ]);
      jobsSpy = jasmine.createSpyObj<JobsService>('JobsService', ['getById']);
      routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
      jobsSpy.getById.and.returnValue(of(stubJob));

      const route = {
         snapshot: {
            paramMap: {
               get: (key: string) => key === 'jobId' ? 'job-1' : null
            },
            queryParamMap: {
               get: (_key: string) => null
            }
         }
      } as ActivatedRoute;

      component = new JobScheduleComponent(assignmentsSpy, recurrenceRulesSpy, jobsSpy, route, routerSpy);
      component.currentJobId = 'job-1';
   });

   it('filters org-wide assignment results down to the active job', () => {
      const assignments: AssignmentDto[] = [
         {
            id: 'assignment-1',
            jobId: 'job-1',
            jobTitle: 'Spring Cleanup',
            clientName: 'Smith Residence',
            scheduledStart: new Date('2026-03-14T14:00:00.000Z'),
            scheduledEnd: new Date('2026-03-14T15:00:00.000Z'),
            scheduleType: ScheduleType.Exact,
            status: 'Scheduled'
         },
         {
            id: 'assignment-2',
            jobId: 'job-2',
            jobTitle: 'Power Wash',
            clientName: 'Matthews',
            scheduledStart: new Date('2026-03-14T16:00:00.000Z'),
            scheduledEnd: new Date('2026-03-14T17:00:00.000Z'),
            scheduleType: ScheduleType.Exact,
            status: 'Scheduled'
         }
      ];
      assignmentsSpy.getAssignments.and.returnValue(of(assignments));

      component.loadAssignments();

      expect(component.jobTitle).toBe('Spring Cleanup');
      expect(component.clientName).toBe('Smith Residence');
      expect(component.calendarEvents.dataSource.length).toBe(1);
      expect(component.calendarEvents.dataSource[0].Id).toBe('assignment-1');
   });

   it('passes notes through when creating a one-time assignment', () => {
      assignmentsSpy.createAssignment.and.returnValue(of({} as any));
      assignmentsSpy.getAssignments.and.returnValue(of([]));

      component.onAssignmentSave({
         jobId: 'job-1',
         scheduledStart: new Date('2026-03-14T14:00:00.000Z'),
         scheduledEnd: new Date('2026-03-14T15:00:00.000Z'),
         scheduleType: ScheduleType.Exact,
         notes: 'Bring ladder'
      });

      expect(assignmentsSpy.createAssignment).toHaveBeenCalledWith('job-1', jasmine.objectContaining({
         notes: 'Bring ladder'
      }));
   });

   it('uses the calendar event id when entity id is missing during reschedule', () => {
      assignmentsSpy.updateAssignmentSchedule.and.returnValue(of({} as any));
      assignmentsSpy.getAssignments.and.returnValue(of([]));

      component.onCalendarEventUpdate({
         Id: 'assignment-1',
         Subject: 'Spring Cleanup',
         StartTime: new Date('2026-03-14T14:00:00.000Z'),
         EndTime: new Date('2026-03-14T15:00:00.000Z')
      });

      expect(assignmentsSpy.updateAssignmentSchedule).toHaveBeenCalledWith('assignment-1', jasmine.objectContaining({
         scheduleType: ScheduleType.Exact
      }));
   });

   it('retains job title and client name from job fetch when no assignments exist in the range', () => {
      assignmentsSpy.getAssignments.and.returnValue(of([]));

      component.jobTitle = 'Spring Cleanup';
      component.clientName = 'Jane Smith';

      component.loadAssignments();

      expect(component.jobTitle).toBe('Spring Cleanup');
      expect(component.clientName).toBe('Jane Smith');
   });
});