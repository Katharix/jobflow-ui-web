import { mapAssignmentsToCalendarEvents } from './assignment-calendar-mapper';
import { AssignmentDto, ScheduleType } from '../../../admin/jobs/models/assignment';

describe('mapAssignmentsToCalendarEvents', () => {
   it('preserves assignment identifiers for calendar update flows', () => {
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
         }
      ];

      const [event] = mapAssignmentsToCalendarEvents(assignments);

      expect(event.Id).toBe('assignment-1');
      expect(event.EntityId).toBe('assignment-1');
      expect(event.EntityType).toBe(ScheduleType.Exact);
   });
});