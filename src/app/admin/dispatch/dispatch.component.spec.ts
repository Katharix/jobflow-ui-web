import { of } from 'rxjs';
import { DispatchComponent } from './dispatch.component';
import { DispatchService } from './services/dispatch.service';
import { AssignmentsService } from '../jobs/services/assignments.service';
import { ScheduleType } from '../jobs/models/assignment';
import { CalendarEvent } from '../../common/jobflow-calendar/models/calendar-event';

describe('DispatchComponent', () => {
  let component: DispatchComponent;
  let dispatchService: jasmine.SpyObj<DispatchService>;
  let assignmentsService: jasmine.SpyObj<AssignmentsService>;

  beforeEach(() => {
    dispatchService = jasmine.createSpyObj<DispatchService>('DispatchService', ['getBoard']);
    assignmentsService = jasmine.createSpyObj<AssignmentsService>('AssignmentsService', [
      'createAssignment',
      'updateAssignmentSchedule',
      'updateAssignmentAssignees',
      'updateAssignmentNotes',
      'updateAssignmentStatus'
    ]);

    dispatchService.getBoard.and.returnValue(of({
      rangeStart: new Date().toISOString(),
      rangeEnd: new Date().toISOString(),
      employees: [],
      assignments: [],
      unscheduledJobs: []
    } as any));

    assignmentsService.createAssignment.and.returnValue(of({} as any));
    assignmentsService.updateAssignmentSchedule.and.returnValue(of({} as any));

    component = new DispatchComponent(dispatchService, assignmentsService);
  });

  it('opens schedule drawer for unscheduled job', () => {
    const job = { jobId: 'job-1', jobTitle: 'Repair', clientName: 'Client A', jobLifecycleStatus: 1 } as any;

    component.scheduleUnscheduled(job);

    expect(component.drawerOpen).toBeTrue();
    expect(component.drawerMode).toBe('schedule');
    expect(component.draftJobId).toBe('job-1');
  });

  it('creates assignment from draft slot when saving schedule', () => {
    const slot: CalendarEvent = {
      StartTime: new Date('2026-03-20T10:00:00.000Z'),
      EndTime: new Date('2026-03-20T11:00:00.000Z'),
      Subject: 'Assignment'
    };

    component.draftSlot = slot;
    component.draftJobId = 'job-2';

    component.saveSchedule();

    expect(assignmentsService.createAssignment).toHaveBeenCalledWith('job-2', {
      scheduledStart: slot.StartTime,
      scheduledEnd: slot.EndTime,
      scheduleType: ScheduleType.Exact
    });
  });

  it('opens details drawer when selecting an assignment event', () => {
    const assignment = {
      id: 'assign-1',
      jobId: 'job-3',
      jobTitle: 'Install',
      clientName: 'Client B',
      scheduledStart: new Date('2026-03-20T10:00:00.000Z'),
      scheduledEnd: new Date('2026-03-20T12:00:00.000Z'),
      scheduleType: ScheduleType.Exact,
      status: 'Scheduled',
      assignees: [{ employeeId: 'emp-1', employeeName: 'Taylor', isLead: true }]
    } as any;

    component.assignments = [assignment];

    component.onCalendarEventSelect({
      Id: 'assign-1',
      EntityId: 'assign-1',
      StartTime: new Date(),
      EndTime: new Date(),
      Subject: 'Install'
    });

    expect(component.drawerOpen).toBeTrue();
    expect(component.drawerMode).toBe('details');
    expect(component.selectedAssignment?.id).toBe('assign-1');
    expect(component.selectedAssigneeIds.has('emp-1')).toBeTrue();
    expect(component.selectedLeadId).toBe('emp-1');
  });
});
