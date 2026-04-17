// job-schedule.component.ts
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';
import { JobflowCalendarComponent } from '../../../common/jobflow-calendar/jobflow-calendar.component';
import { CalendarEvent } from '../../../common/jobflow-calendar/models/calendar-event';
import { CalendarDateClickInfo } from '../../../common/jobflow-calendar/jobflow-calendar.component';
import { LucideAngularModule } from 'lucide-angular';
import { AssignmentsService } from '../services/assignments.service';
import { JobsService } from '../services/jobs.service';
import { mapAssignmentsToCalendarEvents } from '../../../common/jobflow-calendar/utils/assignment-calendar-mapper';
import { ScheduleType } from '../models/assignment';
import { ActivatedRoute, Router } from '@angular/router';
import { Draggable } from '@fullcalendar/interaction';
import { JobAssignmentFormComponent } from '../job-assignments-form/job-assignments-form.component';
import { JobflowDrawerComponent } from '../../../common/jobflow-drawer/jobflow-drawer.component';
import { RecurrenceRuleUpsertRequest } from '../models/recurrence-rule';
import { RecurrenceRulesService } from '../services/recurrence-rules.service';
import { ScheduleSettingsService } from '../../settings/services/schedule-settings.service';
import { ScheduleSettingsDto } from '../../settings/models/schedule-settings';
import { ToastService } from '../../../common/toast/toast.service';
import { Job, JobLifecycleStatus } from '../models/job';

@Component({
  selector: 'app-job-schedule',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, JobflowCalendarComponent, JobAssignmentFormComponent, JobflowDrawerComponent, LucideAngularModule],
  templateUrl: './job-schedule.component.html',
  styleUrls: ['./job-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobScheduleComponent implements OnInit, AfterViewInit, OnDestroy {
  private assignments = inject(AssignmentsService);
  private recurrenceRules = inject(RecurrenceRulesService);
  private jobs = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scheduleSettingsService = inject(ScheduleSettingsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Removed direct calendar ViewChild usage to avoid timing issues
  // @ViewChild(JobflowCalendarComponent)
  // private calendar!: JobflowCalendarComponent;

  @ViewChild(JobAssignmentFormComponent)
  assignmentFormComponent!: JobAssignmentFormComponent;

  @ViewChild('suggestedJobsList')
  suggestedJobsList?: ElementRef<HTMLElement>;

  private draggable?: Draggable;

  calendarEvents = { dataSource: [] as CalendarEvent[] };
  selectedDate = new Date();
  currentJobId: string | null = null;
  jobTitle = '';
  clientName = '';
  showAssignmentModal = false;
  draftEvent: CalendarEvent | null = null;
  private returnToCommandCenter = false;
  jobAddress = '';
  addressMissing = false;
  scheduleSettings: ScheduleSettingsDto | null = null;
  unassignedJobs: Job[] = [];
  loadingUnassignedJobs = false;
  private isRouteScoped = false;

  // Calendar view
  calendarView: 'Day' | 'Week' | 'Month' = 'Month';

  // Date context menu
  contextMenu = { visible: false, x: 0, y: 0, date: null as Date | null, dateLabel: '' };

  get isJobScoped(): boolean {
    return !!this.currentJobId;
  }

  ngOnInit(): void {
    this.returnToCommandCenter = this.route.snapshot.queryParamMap.get('returnTo') === 'dashboard-command-center';

    this.route.paramMap.subscribe((params) => {
      const routeJobId = params.get('jobId') ?? this.route.snapshot.queryParamMap.get('jobId');
      this.applyRouteJobContext(routeJobId);
      this.cdr.markForCheck();
    });

    this.route.queryParamMap.subscribe((queryParams) => {
      const routeJobId = this.route.snapshot.paramMap.get('jobId') ?? queryParams.get('jobId');
      this.applyRouteJobContext(routeJobId);
      this.cdr.markForCheck();
    });

    this.loadScheduleSettings();
    this.loadAssignments();
    this.loadUnassignedJobs();
  }

  ngAfterViewInit(): void {
    this.refreshDraggable();
  }

  ngOnDestroy(): void {
    this.draggable?.destroy();
  }

  onCalendarDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadAssignments();
  }

  loadAssignments(): void {
    const { start, end } = getVisibleRange(this.selectedDate, this.calendarView);

    this.assignments.getAssignments(start, end).subscribe((assignments) => {
      const jobAssignments = this.isRouteScoped && this.currentJobId
        ? assignments.filter((assignment) => assignment.jobId === this.currentJobId)
        : assignments;
      const clientJobInfo = jobAssignments[0];
      if (this.currentJobId && clientJobInfo) {
        this.jobTitle = clientJobInfo.jobTitle;
        this.clientName = clientJobInfo.clientName;
      }

      const events = mapAssignmentsToCalendarEvents(jobAssignments);

      // Drive calendar updates through bound input ([eventSettings]="calendarEvents")
      this.calendarEvents = {
        ...this.calendarEvents,
        dataSource: events,
      };
      this.cdr.markForCheck();
    });
  }

  onCalendarEventCreate(e: CalendarEvent): void {
    if (!this.currentJobId) {
      this.toast.info('Select a job from Suggested jobs before creating a schedule block.');
      return;
    }

    this.draftEvent = e;
    this.selectedDate = e.StartTime;
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
      this.recurrenceRules.upsertJobRecurrence(payload.jobId, {
        scheduledStart: payload.scheduledStart,
        scheduledEnd: payload.scheduledEnd,
        scheduleType: payload.scheduleType,
        recurrence: payload.recurrence,
      }).subscribe({
        next: () => {
          this.showAssignmentModal = false;
          this.draftEvent = null;
          this.loadUnassignedJobs();
          if (this.returnToCommandCenter) {
            this.router.navigate(['/admin'], { fragment: 'dashboard-command-center' });
            return;
          }

          this.loadAssignments(); // your GET already auto-generates via AssignmentGenerator
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.toast.error(error?.error?.description ?? 'Unable to save schedule.');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.assignments.createAssignment(payload.jobId, {
          scheduledStart: payload.scheduledStart,
          scheduledEnd: payload.scheduledEnd,
          scheduleType: payload.scheduleType,
          notes: payload.notes,
        }).subscribe({
          next: () => {
            this.showAssignmentModal = false;
            this.draftEvent = null;
            this.loadUnassignedJobs();
            if (this.returnToCommandCenter) {
              this.router.navigate(['/admin'], { fragment: 'dashboard-command-center' });
              return;
            }

            this.loadAssignments(); // your GET already auto-generates via AssignmentGenerator
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.toast.error(error?.error?.description ?? 'Unable to save schedule.');
            this.cdr.markForCheck();
          }
        });
    }
  }

  onAssignmentDrawerClosed(): void {
    this.showAssignmentModal = false;

    if (this.returnToCommandCenter) {
      this.router.navigate(['/admin'], { fragment: 'dashboard-command-center' });
    }
  }
  addThirtyMinutes(date: Date): Date {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + 30);
    return d;
  }
  onCalendarEventUpdate(e: CalendarEvent): void {
    const assignmentId = e.EntityId ?? e.Id;
    if (!assignmentId) {
      return;
    }

    this.assignments
      .updateAssignmentSchedule(assignmentId, {
        scheduledStart: e.StartTime,
        scheduledEnd: e.EndTime,
        scheduleType: (e.EntityType as ScheduleType) ?? ScheduleType.Exact,
      })
      .subscribe({
        next: () => {
          this.loadAssignments();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.toast.error(error?.error?.description ?? 'Unable to reschedule assignment.');
          this.loadAssignments();
          this.cdr.markForCheck();
        }
      });
  }

  onCalendarViewChange(view: string): void {
    this.calendarView = view as 'Day' | 'Week' | 'Month';
  }

  // --- Date context menu ---

  onDateCellClick(info: CalendarDateClickInfo): void {
    const label = info.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    this.contextMenu = { visible: true, x: info.x, y: info.y, date: info.date, dateLabel: label };
    this.cdr.markForCheck();
  }

  closeContextMenu(): void {
    this.contextMenu = { ...this.contextMenu, visible: false };
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.contextMenu.visible) {
      this.closeContextMenu();
    }
  }

  contextMenuNewJob(): void {
    const date = this.contextMenu.date;
    this.closeContextMenu();
    if (date) {
      this.router.navigate(['/admin/jobs/new'], { queryParams: { scheduledStart: date.toISOString() } });
    }
  }

  contextMenuScheduleOnDate(): void {
    const date = this.contextMenu.date;
    this.closeContextMenu();
    if (!date) return;

    if (!this.currentJobId) {
      this.toast.info('Select a job from Suggested jobs first.');
      return;
    }

    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);

    this.draftEvent = {
      Id: crypto.randomUUID(),
      Subject: this.jobTitle || 'New assignment',
      StartTime: start,
      EndTime: end,
    } as CalendarEvent;
    this.selectedDate = start;
    this.showAssignmentModal = true;
    this.cdr.markForCheck();
  }

  contextMenuShowDayView(): void {
    const date = this.contextMenu.date;
    this.closeContextMenu();
    if (date) {
      this.selectedDate = date;
      this.calendarView = 'Day';
      this.loadAssignments();
      this.cdr.markForCheck();
    }
  }

  private loadScheduleSettings(): void {
    this.scheduleSettingsService.getScheduleSettings().subscribe({
      next: (settings) => {
        this.scheduleSettings = settings;
        this.cdr.markForCheck();
      },
      error: () => {
        this.scheduleSettings = null;
        this.cdr.markForCheck();
      }
    });
  }

  selectSuggestedJob(job: Job): void {
    this.isRouteScoped = false;
    this.currentJobId = job.id;
    this.jobTitle = job.title;
    this.clientName = [job.organizationClient?.firstName, job.organizationClient?.lastName]
      .filter(Boolean)
      .join(' ');
    this.jobAddress = this.buildJobAddress(job);
    this.addressMissing = !this.jobAddress;
    this.loadAssignments();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { jobId: job.id },
      queryParamsHandling: 'merge'
    });
  }

  private loadUnassignedJobs(): void {
    this.loadingUnassignedJobs = true;
    this.jobs.getAllJobs().subscribe({
      next: (jobs) => {
        this.unassignedJobs = jobs
          .filter(job => !job.hasAssignments)
          .filter(job => !this.isClosedStatus(job.lifecycleStatus))
          .sort((a, b) => this.compareJobsByUrgency(a, b));
        this.loadingUnassignedJobs = false;
        this.cdr.markForCheck();
        setTimeout(() => this.refreshDraggable());
      },
      error: () => {
        this.unassignedJobs = [];
        this.loadingUnassignedJobs = false;
        this.cdr.markForCheck();
        setTimeout(() => this.refreshDraggable());
      }
    });
  }

  private loadActiveJob(jobId: string): void {
    this.jobs.getById(jobId).subscribe({
      next: (job) => {
        this.jobTitle = job.title;
        this.clientName = [job.organizationClient?.firstName, job.organizationClient?.lastName]
          .filter(Boolean)
          .join(' ');
        this.jobAddress = this.buildJobAddress(job);
        this.addressMissing = !this.jobAddress;
        this.cdr.markForCheck();
      },
      error: () => {
        this.applyPlannerContext();
        this.router.navigate(['/admin/scheduling-jobs']);
        this.cdr.markForCheck();
      }
    });
  }

  private applyRouteJobContext(routeJobId: string | null): void {
    if (!this.isValidGuid(routeJobId)) {
      this.applyPlannerContext();
      return;
    }

    const normalizedJobId = routeJobId!;

    // Skip if already set (e.g. from selectSuggestedJob)
    if (normalizedJobId === this.currentJobId) {
      return;
    }

    this.currentJobId = normalizedJobId;
    this.isRouteScoped = true;

    const matchingSuggested = this.unassignedJobs.find(job => job.id === normalizedJobId);
    if (matchingSuggested) {
      this.jobTitle = matchingSuggested.title;
      this.clientName = [matchingSuggested.organizationClient?.firstName, matchingSuggested.organizationClient?.lastName]
        .filter(Boolean)
        .join(' ');
      this.jobAddress = this.buildJobAddress(matchingSuggested);
      this.addressMissing = !this.jobAddress;
      this.loadAssignments();
      return;
    }

    this.loadActiveJob(normalizedJobId);
  }

  private applyPlannerContext(): void {
    this.currentJobId = null;
    this.isRouteScoped = false;
    this.jobTitle = 'Schedule jobs';
    this.clientName = 'Select a suggested job to start scheduling.';
    this.addressMissing = true;
    this.loadAssignments();
  }

  private isValidGuid(value: string | null): boolean {
    if (!value) {
      return false;
    }

    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
  }

  private isClosedStatus(status: JobLifecycleStatus): boolean {
    return status === JobLifecycleStatus.Completed
      || status === JobLifecycleStatus.Cancelled
      || status === JobLifecycleStatus.Failed;
  }

  private compareJobsByUrgency(a: Job, b: Job): number {
    const aHasDate = this.hasValidScheduledStart(a);
    const bHasDate = this.hasValidScheduledStart(b);

    // Jobs with a valid scheduled start date are most urgent.
    if (aHasDate !== bHasDate) {
      return aHasDate ? -1 : 1;
    }

    if (aHasDate && bHasDate) {
      const aTime = this.toScheduledTime(a);
      const bTime = this.toScheduledTime(b);
      if (aTime !== bTime) {
        return aTime - bTime;
      }
    }

    const statusRankDiff = this.getUrgencyStatusRank(a.lifecycleStatus) - this.getUrgencyStatusRank(b.lifecycleStatus);
    if (statusRankDiff !== 0) {
      return statusRankDiff;
    }

    return a.title.localeCompare(b.title);
  }

  private getUrgencyStatusRank(status: JobLifecycleStatus): number {
    switch (status) {
      case JobLifecycleStatus.Approved:
        return 0;
      case JobLifecycleStatus.Booked:
        return 1;
      case JobLifecycleStatus.InProgress:
        return 2;
      case JobLifecycleStatus.Draft:
        return 3;
      default:
        return 4;
    }
  }

  private hasValidScheduledStart(job: Job): boolean {
    if (!job.scheduledStart) {
      return false;
    }

    return Number.isFinite(this.toScheduledTime(job));
  }

  private toScheduledTime(job: Job): number {
    if (!job.scheduledStart) {
      return Number.POSITIVE_INFINITY;
    }

    const value = new Date(job.scheduledStart as unknown as string).getTime();
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  }

  private buildJobAddress(job: { organizationClient?: { address1?: string; address2?: string; city?: string; state?: string; zipCode?: string } }): string {
    const client = job.organizationClient;
    const parts = [
      client?.address1,
      client?.address2,
      client?.city,
      client?.state,
      client?.zipCode
    ]
      .map((part) => (part ?? '').trim())
      .filter(Boolean);

    return parts.join(', ');
  }

  onExternalEventCreate(event: CalendarEvent): void {
    if (!event.JobId) {
      return;
    }

    this.currentJobId = event.JobId;

    const matchingJob = this.unassignedJobs.find(j => j.id === event.JobId);
    if (matchingJob) {
      this.jobTitle = matchingJob.title;
      this.clientName = [matchingJob.organizationClient?.firstName, matchingJob.organizationClient?.lastName]
        .filter(Boolean)
        .join(' ');
      this.jobAddress = this.buildJobAddress(matchingJob);
      this.addressMissing = !this.jobAddress;
    }

    this.draftEvent = event;
    this.selectedDate = event.StartTime;
    this.showAssignmentModal = true;
    this.cdr.markForCheck();
  }

  private refreshDraggable(): void {
    if (!this.suggestedJobsList?.nativeElement) {
      return;
    }

    this.draggable?.destroy();

    this.draggable = new Draggable(this.suggestedJobsList.nativeElement, {
      itemSelector: '.suggestions-list__item',
      eventData: (eventEl) => {
        const jobId = eventEl.getAttribute('data-job-id') ?? undefined;
        const title = eventEl.getAttribute('data-title') ?? 'Unscheduled job';

        return {
          title,
          duration: '01:00',
          extendedProps: { JobId: jobId },
        };
      },
    });
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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getVisibleRange(date: Date, view: string): { start: Date; end: Date } {
  switch (view) {
    case 'Month':
      // FullCalendar's month view shows from the Sunday before month start to the Saturday after month end
      return { start: startOfWeek(startOfMonth(date)), end: endOfWeek(endOfMonth(date)) };
    case 'Day':
      return { start: startOfWeek(date), end: endOfWeek(date) };
    default:
      return { start: startOfWeek(date), end: endOfWeek(date) };
  }
}
