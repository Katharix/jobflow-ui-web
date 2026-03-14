import {AssignmentDto} from "../../../admin/jobs/models/assignment";
import {CalendarEvent} from "../models/calendar-event";

export function mapAssignmentsToCalendarEvents(
   assignments: AssignmentDto[]
): CalendarEvent[] {
   return assignments.map(a => ({
      Id: a.id,
      EntityId: a.id,
      EntityType: a.scheduleType,
      Subject: a.jobTitle ?? 'Assignment',
      StartTime: new Date(a.scheduledStart),
      EndTime: a.scheduledEnd
         ? new Date(a.scheduledEnd)
         : new Date(
            new Date(a.scheduledStart).getTime() + 60 * 60 * 1000
         ),
      IsReadonly: false
   }));
}
