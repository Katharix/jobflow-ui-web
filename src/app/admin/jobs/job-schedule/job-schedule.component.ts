// job-schedule.component.ts
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';
import { JobflowCalendarComponent } from '../../../common/jobflow-calendar/jobflow-calendar.component';
import { CalendarEvent } from '../../../common/jobflow-calendar/models/calendar-event';
import { AssignmentsService } from '../services/assignments.service';
import { JobsService } from '../services/jobs.service';
import { WeatherService } from '../../../services/shared/weather.service';
import { WeatherDashboardDto, WeatherForecastDay } from '../../../models/weather';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mapAssignmentsToCalendarEvents } from '../../../common/jobflow-calendar/utils/assignment-calendar-mapper';
import { ScheduleType } from '../models/assignment';
import { ActivatedRoute, Router } from '@angular/router';
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
  imports: [CommonModule, PageHeaderComponent, JobflowCalendarComponent, JobAssignmentFormComponent, JobflowDrawerComponent],
  templateUrl: './job-schedule.component.html',
  styleUrls: ['./job-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobScheduleComponent implements OnInit {
  private assignments = inject(AssignmentsService);
  private recurrenceRules = inject(RecurrenceRulesService);
  private jobs = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private weatherService = inject(WeatherService);
  private scheduleSettingsService = inject(ScheduleSettingsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Removed direct calendar ViewChild usage to avoid timing issues
  // @ViewChild(JobflowCalendarComponent)
  // private calendar!: JobflowCalendarComponent;

  @ViewChild(JobAssignmentFormComponent)
  assignmentFormComponent!: JobAssignmentFormComponent;

  calendarEvents = { dataSource: [] as CalendarEvent[] };
  selectedDate = new Date();
  currentJobId: string | null = null;
  jobTitle = '';
  clientName = '';
  showAssignmentModal = false;
  draftEvent: CalendarEvent | null = null;
  private returnToCommandCenter = false;
  weatherLocation = 'Local area';
  weatherIsApproximate = false;
  weatherIconClass = 'pi pi-cloud';
  weatherConditionText = 'Forecast unavailable';
  weatherForecast: WeatherForecastDay[] = [];
  selectedDayForecast: WeatherForecastDay | null = null;
  jobAddress = '';
  addressMissing = false;
  locationUnavailable = false;
  isWeatherLoading = false;
  scheduleSettings: ScheduleSettingsDto | null = null;
  unassignedJobs: Job[] = [];
  loadingUnassignedJobs = false;
  private isRouteScoped = false;

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

  onCalendarDateChange(date: Date): void {
    this.selectedDate = date;
    this.updateSelectedDayForecast();
    this.loadAssignments();
  }

  loadAssignments(): void {
    const start = startOfWeek(this.selectedDate);
    const end = endOfWeek(this.selectedDate);

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
    this.updateSelectedDayForecast();
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
    this.loadWeatherForecast();
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
      },
      error: () => {
        this.unassignedJobs = [];
        this.loadingUnassignedJobs = false;
        this.cdr.markForCheck();
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
        this.loadWeatherForecast();
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
      this.loadWeatherForecast();
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
    this.locationUnavailable = true;
    this.weatherConditionText = 'Select a job to view forecast';
    this.weatherIconClass = 'pi pi-calendar';
    this.selectedDayForecast = null;
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

  private loadWeatherForecast(): void {
    this.isWeatherLoading = true;

    if (this.addressMissing) {
      this.locationUnavailable = true;
      this.isWeatherLoading = false;
      return;
    }

    this.fetchWeatherByAddress(this.jobAddress);
  }

  private fetchWeatherByAddress(address: string): void {
    this.weatherService
      .getWeatherDashboardByAddress(address)
      .pipe(
        catchError(() => of(this.unavailableWeather()))
      )
      .subscribe((weather) => {
        this.applyWeather(weather);
        this.isWeatherLoading = false;
        this.cdr.markForCheck();
      });
  }

  private applyWeather(weather: WeatherDashboardDto): void {
    if (weather.currentCondition === 'unavailable') {
      this.locationUnavailable = true;
      this.weatherConditionText = 'Forecast unavailable';
      this.weatherIconClass = 'pi pi-map-marker';
      this.selectedDayForecast = null;
      return;
    }

    this.locationUnavailable = false;
    this.weatherLocation = weather.location || 'Local area';
    this.weatherIsApproximate = weather.isApproximate;
    this.weatherConditionText = weather.currentCondition || 'Forecast unavailable';
    this.weatherIconClass = weather.currentIconClass || 'pi pi-cloud';
    this.weatherForecast = weather.forecast ?? [];
    this.updateSelectedDayForecast();
  }

  private updateSelectedDayForecast(forecastOverride?: WeatherForecastDay[]): void {
    const forecast = forecastOverride ?? this.weatherForecast;
    if (!forecast.length) {
      this.selectedDayForecast = null;
      return;
    }

    const selectedKey = this.selectedDate.toISOString().slice(0, 10);
    this.selectedDayForecast = forecast.find(day => day.date === selectedKey) ?? null;
  }

  private unavailableWeather(): WeatherDashboardDto {
    return {
      location: '',
      isApproximate: false,
      currentTempF: 0,
      currentCondition: 'unavailable',
      currentIconClass: 'pi pi-map-marker',
      forecast: []
    };
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
