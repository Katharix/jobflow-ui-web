import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Draggable } from '@fullcalendar/interaction';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';
import { JobflowCalendarComponent } from '../../common/jobflow-calendar/jobflow-calendar.component';
import { JobflowDrawerComponent } from '../../common/jobflow-drawer/jobflow-drawer.component';
import { CalendarEvent } from '../../common/jobflow-calendar/models/calendar-event';
import { AssignmentDto, AssignmentStatus, ScheduleType } from '../jobs/models/assignment';
import { AssignmentsService } from '../jobs/services/assignments.service';
import { Employee } from '../employees/models/employee';
import { DispatchService } from './services/dispatch.service';
import { DispatchUnscheduledJob } from './models/dispatch';

interface DispatchOverviewRow {
  employeeName: string;
  employeeId?: string;
  assignments: AssignmentDto[];
  conflicts: number;
}

@Component({
    selector: 'app-dispatch',
    imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, JobflowCalendarComponent, JobflowDrawerComponent],
    templateUrl: './dispatch.component.html',
    styleUrl: './dispatch.component.scss'
})
export class DispatchComponent implements AfterViewInit, OnDestroy {
  private dispatch = inject(DispatchService);
  private assignmentsService = inject(AssignmentsService);

  @ViewChild('unscheduledList')
  unscheduledList?: ElementRef<HTMLElement>;

  readonly todaysDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  calendarEvents = { dataSource: [] as CalendarEvent[] };
  selectedDate = new Date();
  selectedEmployeeId = '';
  selectedStatus = '';

  employees: Employee[] = [];
  assignments: AssignmentDto[] = [];
  unscheduledJobs: DispatchUnscheduledJob[] = [];

  openTickets = 0;
  crewsOut = 0;
  atRiskJobs = 0;
  completedToday = 0;

  overviewRows: DispatchOverviewRow[] = [];
  nextActions: string[] = [];

  drawerOpen = false;
  drawerMode: 'details' | 'schedule' = 'details';
  selectedAssignment: AssignmentDto | null = null;
  selectedAssigneeIds = new Set<string>();
  selectedLeadId: string | null = null;
  notesDraft = '';
  statusDraft: AssignmentStatus | '' = '';

  draftSlot: CalendarEvent | null = null;
  draftJobId: string | null = null;

  private draggable?: Draggable;

  constructor() {
    this.loadBoard();
  }

  ngAfterViewInit(): void {
    this.refreshDraggable();
  }

  ngOnDestroy(): void {
    if (this.draggable?.destroy) {
      this.draggable.destroy();
    }
  }

  get employeeFilters() {
    return this.employees
      .filter(employee => employee.isActive)
      .map(employee => ({
        label: `${employee.firstName} ${employee.lastName}`.trim(),
        value: employee.id
      }));
  }

  onCalendarDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadBoard();
  }

  onEmployeeFilterChange(value: string): void {
    this.selectedEmployeeId = value;
    this.refreshBoardView();
  }

  onStatusFilterChange(value: string): void {
    this.selectedStatus = value;
    this.refreshBoardView();
  }

  onCalendarEventCreate(event: CalendarEvent): void {
    this.drawerMode = 'schedule';
    this.draftSlot = event;
    this.draftJobId = null;
    this.drawerOpen = true;
  }

  onCalendarEventUpdate(event: CalendarEvent): void {
    const assignmentId = event.EntityId ?? event.Id;
    if (!assignmentId) {
      return;
    }

    this.assignmentsService.updateAssignmentSchedule(assignmentId, {
      scheduledStart: event.StartTime,
      scheduledEnd: event.EndTime,
      scheduleType: ScheduleType.Exact
    }).subscribe(() => this.loadBoard());
  }

  onCalendarEventSelect(event: CalendarEvent): void {
    const assignmentId = event.EntityId ?? event.Id;
    const assignment = this.assignments.find(item => item.id === assignmentId);
    if (!assignment) {
      return;
    }

    this.drawerMode = 'details';
    this.selectedAssignment = assignment;
    this.selectedAssigneeIds = new Set((assignment.assignees ?? []).map(assignee => assignee.employeeId));
    this.selectedLeadId = (assignment.assignees ?? []).find(assignee => assignee.isLead)?.employeeId ?? null;
    this.notesDraft = assignment.notes ?? '';
    this.statusDraft = assignment.status ?? '';
    this.drawerOpen = true;
  }

  onExternalEventCreate(event: CalendarEvent): void {
    if (!event.JobId) {
      return;
    }

    this.assignmentsService.createAssignment(event.JobId, {
      scheduledStart: event.StartTime,
      scheduledEnd: event.EndTime,
      scheduleType: ScheduleType.Exact
    }).subscribe(() => this.loadBoard());
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.drawerMode = 'details';
    this.selectedAssignment = null;
    this.draftSlot = null;
    this.draftJobId = null;
  }

  saveSchedule(): void {
    if (!this.draftSlot || !this.draftJobId) {
      return;
    }

    this.assignmentsService.createAssignment(this.draftJobId, {
      scheduledStart: this.draftSlot.StartTime,
      scheduledEnd: this.draftSlot.EndTime,
      scheduleType: ScheduleType.Exact
    }).subscribe(() => {
      this.closeDrawer();
      this.loadBoard();
    });
  }

  toggleAssignee(employeeId: string): void {
    if (this.selectedAssigneeIds.has(employeeId)) {
      this.selectedAssigneeIds.delete(employeeId);
      if (this.selectedLeadId === employeeId) {
        this.selectedLeadId = null;
      }
      return;
    }

    this.selectedAssigneeIds.add(employeeId);
  }

  saveAssignmentDetails(): void {
    if (!this.selectedAssignment) {
      return;
    }

    const assignmentId = this.selectedAssignment.id;

    const assigneeUpdate = this.assignmentsService.updateAssignmentAssignees(assignmentId, {
      employeeIds: Array.from(this.selectedAssigneeIds),
      leadEmployeeId: this.selectedLeadId
    });

    const notesUpdate = this.assignmentsService.updateAssignmentNotes(assignmentId, {
      notes: this.notesDraft
    });

    const statusUpdate = this.statusDraft
      ? this.assignmentsService.updateAssignmentStatus(assignmentId, { status: this.statusDraft })
      : null;

    assigneeUpdate.subscribe(() => {
      notesUpdate.subscribe(() => {
        if (statusUpdate) {
          statusUpdate.subscribe(() => this.loadBoard());
        } else {
          this.loadBoard();
        }
      });
    });
  }

  scheduleUnscheduled(job: DispatchUnscheduledJob): void {
    this.drawerMode = 'schedule';
    this.draftSlot = {
      StartTime: this.selectedDate,
      EndTime: this.addThirtyMinutes(this.selectedDate),
      Subject: job.jobTitle ?? 'Assignment'
    };
    this.draftJobId = job.jobId;
    this.drawerOpen = true;
  }

  private loadBoard(): void {
    const start = this.startOfWeek(this.selectedDate);
    const end = this.endOfWeek(this.selectedDate);

    this.dispatch.getBoard(start, end).subscribe(board => {
      this.employees = board.employees ?? [];
      this.assignments = board.assignments ?? [];
      this.unscheduledJobs = board.unscheduledJobs ?? [];
      this.openTickets = this.unscheduledJobs.length;

      this.refreshBoardView();
      this.refreshDraggable();
    });
  }

  private refreshBoardView(): void {
    const filtered = this.applyFilters(this.assignments);
    const conflicts = this.resolveConflicts(filtered);

    this.calendarEvents = {
      ...this.calendarEvents,
      dataSource: this.mapAssignmentsToEvents(filtered, conflicts)
    };

    const todaysAssignments = this.filterAssignmentsForDate(filtered, this.selectedDate);
    this.crewsOut = this.countActiveCrews(todaysAssignments);
    this.atRiskJobs = conflicts.size;
    this.completedToday = todaysAssignments.filter(a => a.status === 'Completed').length;
    this.overviewRows = this.buildOverviewRows(todaysAssignments, conflicts);
    this.nextActions = this.buildNextActions();
  }

  private applyFilters(assignments: AssignmentDto[]): AssignmentDto[] {
    return assignments.filter(assignment => {
      if (this.selectedEmployeeId) {
        const isAssigned = (assignment.assignees ?? []).some(assignee => assignee.employeeId === this.selectedEmployeeId);
        if (!isAssigned) return false;
      }

      if (this.selectedStatus) {
        return assignment.status === this.selectedStatus;
      }

      return true;
    });
  }

  private mapAssignmentsToEvents(assignments: AssignmentDto[], conflicts: Set<string>): CalendarEvent[] {
    return assignments.map(assignment => {
      const scheduleType = assignment.scheduleType ?? ScheduleType.Exact;
      const cssClass = scheduleType === ScheduleType.Window ? 'jobflow-event-window' : 'jobflow-event-exact';
      const conflictClass = conflicts.has(assignment.id) ? 'dispatch-conflict' : '';
      const jobLabel = assignment.jobTitle ?? 'Assignment';

      return {
        Id: assignment.id,
        EntityId: assignment.id,
        JobId: assignment.jobId,
        EntityType: scheduleType,
        Subject: jobLabel,
        StartTime: new Date(assignment.scheduledStart),
        EndTime: assignment.scheduledEnd
          ? new Date(assignment.scheduledEnd)
          : this.addOneHour(new Date(assignment.scheduledStart)),
        CssClass: `${cssClass} ${conflictClass}`.trim(),
        StatusLabel: assignment.status ?? 'Scheduled'
      };
    });
  }

  private buildOverviewRows(assignments: AssignmentDto[], conflicts: Set<string>): DispatchOverviewRow[] {
    const rows: DispatchOverviewRow[] = [];
    const unassigned: DispatchOverviewRow = {
      employeeName: 'Unassigned',
      assignments: [],
      conflicts: 0
    };

    const employeeMap = new Map<string, DispatchOverviewRow>();

    assignments.forEach(assignment => {
      const assignees = assignment.assignees ?? [];
      if (!assignees.length) {
        unassigned.assignments.push(assignment);
        if (conflicts.has(assignment.id)) {
          unassigned.conflicts += 1;
        }
        return;
      }

      assignees.forEach(assignee => {
        const key = assignee.employeeId;
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            employeeName: assignee.employeeName ?? 'Crew member',
            employeeId: assignee.employeeId,
            assignments: [],
            conflicts: 0
          });
        }
        const row = employeeMap.get(key)!;
        row.assignments.push(assignment);
        if (conflicts.has(assignment.id)) {
          row.conflicts += 1;
        }
      });
    });

    rows.push(...Array.from(employeeMap.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName)));
    if (unassigned.assignments.length) {
      rows.push(unassigned);
    }

    return rows;
  }

  private buildNextActions(): string[] {
    const actions: string[] = [];

    if (this.unscheduledJobs.length) {
      actions.push(`Schedule ${this.unscheduledJobs.length} open job${this.unscheduledJobs.length === 1 ? '' : 's'}`);
    }

    if (this.atRiskJobs) {
      actions.push(`Resolve ${this.atRiskJobs} crew conflict${this.atRiskJobs === 1 ? '' : 's'}`);
    }

    if (!actions.length) {
      actions.push('All crews aligned. Keep monitoring updates.');
    }

    return actions;
  }

  private resolveConflicts(assignments: AssignmentDto[]): Set<string> {
    const conflicts = new Set<string>();
    const grouped = new Map<string, AssignmentDto[]>();

    assignments.forEach(assignment => {
      (assignment.assignees ?? []).forEach(assignee => {
        if (!grouped.has(assignee.employeeId)) {
          grouped.set(assignee.employeeId, []);
        }
        grouped.get(assignee.employeeId)!.push(assignment);
      });
    });

    grouped.forEach(items => {
      const sorted = items
        .slice()
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

      for (let i = 0; i < sorted.length; i += 1) {
        const current = sorted[i];
        const currentEnd = current.scheduledEnd
          ? new Date(current.scheduledEnd)
          : this.addOneHour(new Date(current.scheduledStart));

        for (let j = i + 1; j < sorted.length; j += 1) {
          const next = sorted[j];
          const nextStart = new Date(next.scheduledStart);
          if (nextStart >= currentEnd) {
            break;
          }

          conflicts.add(current.id);
          conflicts.add(next.id);
        }
      }
    });

    return conflicts;
  }

  private filterAssignmentsForDate(assignments: AssignmentDto[], date: Date): AssignmentDto[] {
    const target = date.toISOString().slice(0, 10);
    return assignments.filter(assignment => new Date(assignment.scheduledStart).toISOString().slice(0, 10) === target);
  }

  private countActiveCrews(assignments: AssignmentDto[]): number {
    const crewIds = new Set<string>();
    assignments.forEach(assignment => {
      (assignment.assignees ?? []).forEach(assignee => crewIds.add(assignee.employeeId));
    });

    return crewIds.size;
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private endOfWeek(date: Date): Date {
    const end = this.startOfWeek(date);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private addThirtyMinutes(date: Date): Date {
    const next = new Date(date);
    next.setMinutes(next.getMinutes() + 30);
    return next;
  }

  private addOneHour(date: Date): Date {
    const next = new Date(date);
    next.setHours(next.getHours() + 1);
    return next;
  }

  private refreshDraggable(): void {
    if (!this.unscheduledList?.nativeElement) {
      return;
    }

    if (this.draggable?.destroy) {
      this.draggable.destroy();
    }

    this.draggable = new Draggable(this.unscheduledList.nativeElement, {
      itemSelector: '.dispatch-queue__item',
      eventData: (eventEl) => {
        const jobId = eventEl.getAttribute('data-job-id') ?? undefined;
        const title = eventEl.getAttribute('data-title') ?? 'Unscheduled job';

        return {
          title,
          duration: '01:00',
          extendedProps: {
            JobId: jobId
          }
        };
      }
    });
  }
}
