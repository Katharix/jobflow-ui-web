import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import { LucideAngularModule } from 'lucide-angular';
import {
  CalendarOptions,
  DatesSetArg,
  DateSelectArg,
  EventContentArg,
  EventDropArg,
  EventApi,
} from '@fullcalendar/core';
import { CalendarEvent } from './models/calendar-event';
import { ScheduleType } from '../../admin/jobs/models/assignment';

export type CalendarMode = 'dispatch' | 'context';

@Component({
  selector: 'jobflow-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, LucideAngularModule],
  templateUrl: './jobflow-calendar.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./jobflow-calendar.component.scss'],
})
export class JobflowCalendarComponent {
  private _selectedDate: Date = new Date();
  private _calendarView: string = 'Week';
  private _eventSettings: any = {
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
    },
    dataSource: [],
  };

  @Input() cssClass = 'jobflow-scheduler';
  @Input() mode: CalendarMode = 'dispatch';
  @Output() eventCreate = new EventEmitter<CalendarEvent>();
  @Output() eventChange = new EventEmitter<CalendarEvent>();

  @ViewChild('fullCalendar')
  private fullCalendar?: FullCalendarComponent;

  calendarOptions: CalendarOptions = this.buildCalendarOptions();

  @Input() set selectedDate(value: Date) {
    if (!value) return;

    const nextDate = this.normalizeSelectedDate(value, this._calendarView);
    const hasChanged = !this.isSameCalendarDay(this._selectedDate, nextDate);
    this._selectedDate = nextDate;

    if (hasChanged) {
      this.gotoDate(nextDate);
    }
  }

  get selectedDate(): Date {
    return this._selectedDate;
  }

  @Output() selectedDateChange = new EventEmitter<Date>();

  @Input() set calendarView(value: string) {
    if (!value) return;
    if (value === this._calendarView) return;

    this._calendarView = value;
    this._selectedDate = this.normalizeSelectedDate(this._selectedDate, value);
    this.changeView(value);
  }

  get selectedRangeLabel(): string {
    const normalizedView = this._calendarView.toLowerCase();
    const referenceDate = this.normalizeSelectedDate(this.selectedDate, this._calendarView);

    if (normalizedView === 'day') {
      return referenceDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }

    if (normalizedView === 'month') {
      return referenceDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    }

    const start = this.getStartOfWeek(referenceDate);
    const end = this.getEndOfWeek(referenceDate);

    const startFormatted = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    const endFormatted = end.toLocaleDateString(undefined, {
      month: start.getMonth() === end.getMonth() ? undefined : 'short',
      day: 'numeric',
      year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
    });

    return `${startFormatted} - ${endFormatted}${start.getFullYear() === end.getFullYear() ? `, ${end.getFullYear()}` : ''}`;
  }

  get currentViewLabel(): string {
    return this._calendarView === 'Month' ? 'Monthly planner' : this._calendarView === 'Day' ? 'Daily schedule' : 'Weekly schedule';
  }

  get totalEvents(): number {
    return this.eventSettings?.dataSource?.length ?? 0;
  }

  get exactEvents(): number {
    return (this.eventSettings?.dataSource ?? []).filter(
      (event: CalendarEvent) => this.getEventVariant(event.EntityType) === 'exact'
    ).length;
  }

  get windowEvents(): number {
    return (this.eventSettings?.dataSource ?? []).filter(
      (event: CalendarEvent) => this.getEventVariant(event.EntityType) === 'window'
    ).length;
  }

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay(); // Sunday = 0
    start.setDate(start.getDate() - day);
    return start;
  }

  private getEndOfWeek(date: Date): Date {
    const end = this.getStartOfWeek(date);
    end.setDate(end.getDate() + 6);
    return end;
  }

  get calendarView(): string {
    return this._calendarView;
  }

  @Output() calendarViewChange = new EventEmitter<string>();

  @Input() views: string[] = ['Day', 'Week', 'Month'];
  @Input() set eventSettings(value: any) {
    this._eventSettings = value ?? { dataSource: [] };
    this.refreshCalendarOptions();
  }

  get eventSettings(): any {
    return this._eventSettings;
  }

  @Input() height: string = '650px';

  // 🔁 Optional filters and grouping
  @Input() filters: { label: string; value: string }[] = [];
  @Input() selectedFilter: string = '';
  @Output() selectedFilterChange = new EventEmitter<string>();

  @Input() resources: any[] = []; // array of resource definitions (e.g., employees)
  @Input() group: any | undefined;

  goPrev() {
    const newDate = new Date(this.normalizeSelectedDate(this._selectedDate, this._calendarView));
    switch (this._calendarView.toLowerCase()) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      default:
        newDate.setDate(newDate.getDate() - 1);
    }
    this.updateDate(newDate);
  }

  goNext() {
    const newDate = new Date(this.normalizeSelectedDate(this._selectedDate, this._calendarView));
    switch (this._calendarView.toLowerCase()) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      default:
        newDate.setDate(newDate.getDate() + 1);
    }
    this.updateDate(newDate);
  }

  goToday() {
    this.updateDate(new Date());
  }

  setView(view: string) {
    this._calendarView = view;
    this._selectedDate = this.normalizeSelectedDate(this._selectedDate, view);
    this.calendarViewChange.emit(this._calendarView);
    this.changeView(view);
    this.refreshCalendarOptions();
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter = target.value;
    this.selectedFilterChange.emit(this.selectedFilter);
  }

  private onDateClick(args: DateClickArg): void {
    if (this.isReadOnly) return;

    const start = new Date(args.date);
    const end = args.allDay
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
      : new Date(start.getTime() + 30 * 60 * 1000);

    const event: CalendarEvent = {
      StartTime: start,
      EndTime: end,
      Subject: '',
      EntityType: ScheduleType.Exact,
      CssClass: this.getEventCssClass(ScheduleType.Exact),
    };

    this.eventCreate.emit(event);
  }

  private onDateSelect(args: DateSelectArg): void {
    if (this.isReadOnly) return;

    const event: CalendarEvent = {
      StartTime: new Date(args.start),
      EndTime: new Date(args.end),
      Subject: '',
      EntityType: ScheduleType.Exact,
      CssClass: this.getEventCssClass(ScheduleType.Exact),
    };

    this.eventCreate.emit(event);
  }

  private updateDate(date: Date) {
    if (!date) return;

    const nextDate = this.normalizeSelectedDate(date, this._calendarView);
    if (this.isSameCalendarDay(this._selectedDate, nextDate)) {
      return;
    }

    this._selectedDate = nextDate;
    this.selectedDateChange.emit(this._selectedDate);
    this.gotoDate(this._selectedDate);
  }

  get isReadOnly(): boolean {
    return this.mode === 'context';
  }

  get allowInteraction(): boolean {
    return this.mode === 'dispatch';
  }

  get effectiveViews(): string[] {
    return this.mode === 'context' ? ['Day', 'Week'] : this.views;
  }

  setEvents(events: CalendarEvent[]) {
    const dataSource = events.map(event => ({
      ...event,
      CssClass: event.CssClass ?? this.getEventCssClass(event.EntityType),
    }));

    this.eventSettings = {
      ...this.eventSettings,
      dataSource,
    };
  }

  private onEventDrop(args: EventDropArg): void {
    if (this.isReadOnly) {
      args.revert();
      return;
    }

    const event = this.mapEventApiToCalendarEvent(args.event);
    if (event) {
      this.eventChange.emit(event);
    }
  }

  private onEventResize(args: EventResizeDoneArg): void {
    if (this.isReadOnly) {
      args.revert();
      return;
    }

    const event = this.mapEventApiToCalendarEvent(args.event);
    if (event) {
      this.eventChange.emit(event);
    }
  }

  private mapEventApiToCalendarEvent(event: EventApi): CalendarEvent {
    const entityType = event.extendedProps['EntityType'];
    return {
      Id: event.id || event.extendedProps['Id'],
      Subject: event.title,
      StartTime: new Date(event.start ?? new Date()),
      EndTime: new Date(event.end ?? event.start ?? new Date()),
      IsReadonly: this.isReadOnly,
      EntityType: entityType,
      EntityId: event.extendedProps['EntityId'] ?? event.id,
      CssClass: (Array.isArray(event.classNames) && event.classNames[0]) || this.getEventCssClass(entityType),
    };
  }

  private toFullCalendarView(view: string): string {
    switch (view.toLowerCase()) {
      case 'day':
        return 'timeGridDay';
      case 'week':
        return 'timeGridWeek';
      case 'month':
        return 'dayGridMonth';
      default:
        return 'timeGridWeek';
    }
  }

  private fromFullCalendarView(viewType: string): string {
    if (viewType.includes('dayGridMonth')) return 'Month';
    if (viewType.includes('timeGridDay')) return 'Day';
    return 'Week';
  }

  private getDefaultEnd(start: Date): Date {
    const isMonth = this.toFullCalendarView(this.calendarView) === 'dayGridMonth';
    return isMonth
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
      : new Date(start.getTime() + 30 * 60 * 1000);
  }

  private mapEventsForFullCalendar(events: CalendarEvent[]) {
    return events.map((event) => {
      const cssClass = event.CssClass ?? this.getEventCssClass(event.EntityType);

      return {
        id: event.Id?.toString(),
        title: event.Subject,
        start: event.StartTime,
        end: event.EndTime,
        classNames: [cssClass],
        editable: this.allowInteraction,
        extendedProps: {
          Id: event.Id,
          EntityType: event.EntityType,
          EntityId: event.EntityId,
          CssClass: cssClass,
        },
      };
    });
  }

  private renderEventContent(arg: EventContentArg) {
    const entityType = arg.event.extendedProps['EntityType'];
    const variant = this.getEventVariant(entityType);
    const title = this.escapeHtml(arg.event.title || 'Open slot');
    const timeText = this.escapeHtml(arg.timeText || '');
    const badgeLabel = variant === 'window' ? 'Window' : variant === 'exact' ? 'Exact' : 'Scheduled';
    const compactClass = arg.view.type.includes('dayGridMonth') ? ' is-compact' : '';

    return {
      html: `
        <div class="jobflow-event-card jobflow-event-card--${variant}${compactClass}">
          <div class="jobflow-event-card__time">${timeText}</div>
          <div class="jobflow-event-card__title">${title}</div>
          <div class="jobflow-event-card__meta">${badgeLabel}</div>
        </div>
      `,
    };
  }

  private buildCalendarOptions(): CalendarOptions {
    const mappedView = this.toFullCalendarView(this.calendarView);
    const events = this.mapEventsForFullCalendar(this.eventSettings?.dataSource ?? []);

    return {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: mappedView,
      headerToolbar: false,
      allDaySlot: false,
      nowIndicator: true,
      selectable: this.allowInteraction,
      selectMirror: this.allowInteraction,
      editable: this.allowInteraction,
      eventDurationEditable: this.allowInteraction,
      eventStartEditable: this.allowInteraction,
      dayMaxEvents: true,
      firstDay: 0,
      slotDuration: '00:30:00',
      scrollTime: '06:00:00',
      expandRows: true,
      eventContent: (arg) => this.renderEventContent(arg),
      dayHeaderFormat: { weekday: 'short' },
      titleFormat: { month: 'long', year: 'numeric' },
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short',
      },
      height: this.height,
      events,
      dateClick: (arg) => this.onDateClick(arg),
      select: (arg) => this.onDateSelect(arg),
      eventDrop: (arg) => this.onEventDrop(arg),
      eventResize: (arg) => this.onEventResize(arg),
      datesSet: (arg: DatesSetArg) => {
        const currentStart = (arg.view as { currentStart?: Date }).currentStart;
        const visibleDate = this.normalizeSelectedDate(currentStart ?? arg.start, this.fromFullCalendarView(arg.view.type));
        if (!this.isSameCalendarDay(this._selectedDate, visibleDate)) {
          this._selectedDate = visibleDate;
          this.selectedDateChange.emit(visibleDate);
        }

        const mapped = this.fromFullCalendarView(arg.view.type);
        if (mapped !== this._calendarView) {
          this._calendarView = mapped;
          this.calendarViewChange.emit(mapped);
        }
      },
    };
  }

  private refreshCalendarOptions() {
    this.calendarOptions = this.buildCalendarOptions();
  }

  private gotoDate(date: Date) {
    const api = this.fullCalendar?.getApi();
    if (api) {
      api.gotoDate(date);
    }
  }

  private changeView(view: string) {
    const api = this.fullCalendar?.getApi();
    if (api) {
      api.changeView(this.toFullCalendarView(view));
    }
  }

  private getEventCssClass(entityType?: ScheduleType | number | string): string {
    const variant = this.getEventVariant(entityType);
    if (variant === 'window') {
      return 'jobflow-event-window';
    }

    if (variant === 'exact') {
      return 'jobflow-event-exact';
    }

    return 'jobflow-event-default';
  }

  private getEventVariant(entityType?: ScheduleType | number | string): 'window' | 'exact' | 'default' {
    const normalizedType = this.normalizeScheduleType(entityType);

    if (normalizedType === ScheduleType.Window) {
      return 'window';
    }

    if (normalizedType === ScheduleType.Exact) {
      return 'exact';
    }

    return 'default';
  }

  private normalizeScheduleType(entityType?: ScheduleType | number | string): ScheduleType | undefined {
    if (entityType === ScheduleType.Window || entityType === ScheduleType.Exact) {
      return entityType;
    }

    if (entityType === 'Window' || entityType === '1' || entityType === 1) {
      return ScheduleType.Window;
    }

    if (entityType === 'Exact' || entityType === '2' || entityType === 2) {
      return ScheduleType.Exact;
    }

    return undefined;
  }

  private normalizeSelectedDate(date: Date, view: string): Date {
    const normalizedDate = new Date(date);

    if (view.toLowerCase() === 'month') {
      normalizedDate.setDate(1);
    }

    return normalizedDate;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private isSameCalendarDay(left: Date | undefined, right: Date | undefined): boolean {
    if (!left || !right) {
      return false;
    }

    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }
}
