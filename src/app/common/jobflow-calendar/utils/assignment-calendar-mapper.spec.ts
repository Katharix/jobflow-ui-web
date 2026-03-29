import { mapAssignmentsToCalendarEvents } from './assignment-calendar-mapper';
import { AssignmentDto, ScheduleType } from '../../../admin/jobs/models/assignment';

describe('AssignmentCalendarMapper', () => {
  it('maps status labels onto calendar events', () => {
    const assignment: AssignmentDto = {
      id: 'a1',
      jobId: 'j1',
      jobTitle: 'Roof Check',
      clientName: 'Client A',
      scheduledStart: new Date('2026-03-20T10:00:00.000Z'),
      scheduledEnd: new Date('2026-03-20T12:00:00.000Z'),
      scheduleType: ScheduleType.Exact,
      status: 'Scheduled',
      statusLabel: 'Queued'
    };

    const [event] = mapAssignmentsToCalendarEvents([assignment]);

    expect(event.StatusLabel).toBe('Queued');
    expect(event.CssClass).toContain('jobflow-event-exact');
  });
});