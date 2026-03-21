// job-schedule.component.ts
import { Component, OnInit, ViewChild, inject } from '@angular/core';

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

@Component({
  selector: 'app-job-schedule',
  standalone: true,
  imports: [PageHeaderComponent, JobflowCalendarComponent, JobAssignmentFormComponent, JobflowDrawerComponent],
  templateUrl: './job-schedule.component.html',
  styleUrls: ['./job-schedule.component.scss']
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

  // Removed direct calendar ViewChild usage to avoid timing issues
  // @ViewChild(JobflowCalendarComponent)
  // private calendar!: JobflowCalendarComponent;

  @ViewChild(JobAssignmentFormComponent)
  assignmentFormComponent!: JobAssignmentFormComponent;

  calendarEvents = { dataSource: [] as CalendarEvent[] };
  selectedDate = new Date();
  currentJobId!: string;
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

  ngOnInit(): void {
    this.currentJobId = this.route.snapshot.paramMap.get('jobId')!;
    this.returnToCommandCenter = this.route.snapshot.queryParamMap.get('returnTo') === 'dashboard-command-center';

    this.jobs.getById(this.currentJobId).subscribe((job) => {
      this.jobTitle = job.title;
      this.clientName = [job.organizationClient?.firstName, job.organizationClient?.lastName]
        .filter(Boolean)
        .join(' ');
      this.jobAddress = this.buildJobAddress(job);
      this.addressMissing = !this.jobAddress;
      this.loadWeatherForecast();
    });
    this.loadScheduleSettings();
    this.loadAssignments();
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
      const jobAssignments = assignments.filter((assignment) => assignment.jobId === this.currentJobId);
      const clientJobInfo = jobAssignments[0];
      if (clientJobInfo) {
        this.jobTitle = clientJobInfo.jobTitle;
        this.clientName = clientJobInfo.clientName;
      }

      const events = mapAssignmentsToCalendarEvents(jobAssignments);

      // Drive calendar updates through bound input ([eventSettings]="calendarEvents")
      this.calendarEvents = {
        ...this.calendarEvents,
        dataSource: events,
      };
    });
  }

  onCalendarEventCreate(e: CalendarEvent): void {
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
          if (this.returnToCommandCenter) {
            this.router.navigate(['/admin'], { fragment: 'dashboard-command-center' });
            return;
          }

          this.loadAssignments(); // your GET already auto-generates via AssignmentGenerator
        },
        error: (error) => {
          this.toast.error(error?.error?.description ?? 'Unable to save schedule.');
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
            if (this.returnToCommandCenter) {
              this.router.navigate(['/admin'], { fragment: 'dashboard-command-center' });
              return;
            }

            this.loadAssignments(); // your GET already auto-generates via AssignmentGenerator
          },
          error: (error) => {
            this.toast.error(error?.error?.description ?? 'Unable to save schedule.');
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
        next: () => this.loadAssignments(),
        error: (error) => {
          this.toast.error(error?.error?.description ?? 'Unable to reschedule assignment.');
          this.loadAssignments();
        }
      });
  }

  private loadScheduleSettings(): void {
    this.scheduleSettingsService.getScheduleSettings().subscribe({
      next: (settings) => {
        this.scheduleSettings = settings;
      },
      error: () => {
        this.scheduleSettings = null;
      }
    });
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
