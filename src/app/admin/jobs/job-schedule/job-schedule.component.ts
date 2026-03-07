// job-schedule.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../views/admin-views/dashboard/page-header/page-header.component';
import { JobflowCalendarComponent } from '../../../common/jobflow-calendar/jobflow-calendar.component';
import { CalendarEvent } from '../../../common/jobflow-calendar/models/calendar-event';
import { AssignmentsService } from '../services/assignments.service';
import { mapAssignmentsToCalendarEvents } from '../../../common/jobflow-calendar/utils/assignment-calendar-mapper';
import { ScheduleType } from '../models/assignment';
import { ActivatedRoute } from '@angular/router';
import { JobAssignmentFormComponent } from '../job-assignments-form/job-assignments-form.component';
import { JobflowDrawerComponent } from '../../../common/jobflow-drawer/jobflow-drawer.component';
import { RecurrenceRuleUpsertRequest } from '../models/recurrence-rule';
import { RecurrenceRulesService } from '../services/recurrence-rules.service';

@Component({
  selector: 'app-job-schedule',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, JobflowCalendarComponent, JobAssignmentFormComponent, JobflowDrawerComponent],
  templateUrl: './job-schedule.component.html',
  styleUrls: ['./job-schedule.component.scss']
})
export class JobScheduleComponent implements OnInit {
  // Removed direct calendar ViewChild usage to avoid timing issues
  // @ViewChild(JobflowCalendarComponent)
  // private calendar!: JobflowCalendarComponent;

  @ViewChild(JobAssignmentFormComponent)
  assignmentFormComponent!: JobAssignmentFormComponent;

  calendarEvents = { dataSource: [] as CalendarEvent[] };
  selectedDate = new Date();
  currentJobId!: string;
  jobTitle: string = '';
  clientName: string = '';
  showAssignmentModal = false;
  draftEvent: CalendarEvent | null = null;

  constructor(
    private assignments: AssignmentsService,
    private recurrenceRules: RecurrenceRulesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentJobId = this.route.snapshot.paramMap.get('jobId')!;
    this.loadAssignments();
  }

  onCalendarDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadAssignments();
  }

  loadAssignments(): void {
    const start = startOfWeek(this.selectedDate);
    const end = endOfWeek(this.selectedDate);

    this.assignments.getAssignments(start, end).subscribe((assignments) => {
      const clientJobInfo = assignments[0];
      this.jobTitle = clientJobInfo?.jobTitle ?? '';
      this.clientName = clientJobInfo?.clientName ?? '';

      const events = mapAssignmentsToCalendarEvents(assignments);

      // Drive calendar updates through bound input ([eventSettings]="calendarEvents")
      this.calendarEvents = {
        ...this.calendarEvents,
        dataSource: events,
      };
    });
  }

  onCalendarEventCreate(e: CalendarEvent): void {
    this.draftEvent = e;
    this.showAssignmentModal = true;
  }

  onAssignmentSave(payload: {
    jobId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    scheduleType: ScheduleType;
    notes?: string;
    recurrence?: RecurrenceRuleUpsertRequest;
  }) {
    if (payload.recurrence) {
      this.recurrenceRules.upsertJobRecurrence(payload.jobId, payload.recurrence).subscribe(() => {
        this.showAssignmentModal = false;
        this.draftEvent = null;
        this.loadAssignments(); // your GET already auto-generates via AssignmentGenerator
      });
    } else {
      this.assignments.createAssignment(payload.jobId, {
          scheduledStart: payload.scheduledStart,
          scheduledEnd: payload.scheduledEnd,
          scheduleType: payload.scheduleType,
        }).subscribe(() => {
        this.showAssignmentModal = false;
        this.draftEvent = null;
        this.loadAssignments(); // your GET already auto-generates via AssignmentGenerator
      });
    }
  }
  addThirtyMinutes(date: Date): Date {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + 30);
    return d;
  }
  onCalendarEventUpdate(e: CalendarEvent): void {
    this.assignments
      .updateAssignmentSchedule(e.EntityId!, {
        scheduledStart: e.StartTime,
        scheduledEnd: e.EndTime,
        scheduleType: ScheduleType.Exact,
      })
      .subscribe(() => this.loadAssignments());
  }
}

/* ---- helpers ---- */

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
}
