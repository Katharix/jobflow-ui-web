import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {LucideAngularModule} from 'lucide-angular';
import {
   ScheduleModule,
   GroupModel,
   DayService,
   WeekService,
   MonthService,
   ActionEventArgs,
   EventClickArgs, ScheduleComponent
} from '@syncfusion/ej2-angular-schedule';
import {CalendarEvent} from "./models/calendar-event";
import {ScheduleType} from "../../admin/jobs/models/assignment";


export type CalendarMode = 'dispatch' | 'context';

@Component({
   selector: 'jobflow-calendar',
   standalone: true,
   imports: [CommonModule, FormsModule, ScheduleModule, LucideAngularModule],
   templateUrl: './jobflow-calendar.component.html',
   encapsulation: ViewEncapsulation.None,
   styleUrls: ['./jobflow-calendar.component.scss'],
   providers: [
      DayService,
      WeekService,
      MonthService
   ],

})


export class JobflowCalendarComponent {
   private _selectedDate: Date = new Date();
   private _calendarView: string = 'Week';

   @Input() cssClass = 'jobflow-scheduler';
   @Input() mode: CalendarMode = 'dispatch';
   @Output() eventCreate = new EventEmitter<CalendarEvent>();
   @Output() eventChange = new EventEmitter<CalendarEvent>();

   @ViewChild(ScheduleComponent)
   private scheduler!: ScheduleComponent;

   @Input() set selectedDate(value: Date) {
      this._selectedDate = value;
      this.selectedDateChange.emit(this._selectedDate);
   }

   get selectedDate(): Date {
      return this._selectedDate;
   }

   @Output() selectedDateChange = new EventEmitter<Date>();

   @Input() set calendarView(value: string) {
      this._calendarView = value;
      this.calendarViewChange.emit(this._calendarView);
   }

   get selectedWeekRange(): string {
      const start = this.getStartOfWeek(this.selectedDate);
      const end = this.getEndOfWeek(this.selectedDate);

      const sameMonth = start.getMonth() === end.getMonth();
      const sameYear = start.getFullYear() === end.getFullYear();

      const options: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric'};

      const startFormatted = start.toLocaleDateString(undefined, options);
      const endFormatted = end.toLocaleDateString(undefined, {
         ...options,
         ...(sameMonth ? {} : {month: 'short'}),
         ...(sameYear ? {} : {year: 'numeric'}),
      });

      const year = end.getFullYear();

      return `${startFormatted} – ${endFormatted}, ${year}`;
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
   @Input() eventSettings: any = {
      fields: {
         id: 'Id',
         subject: {name: 'Subject'},
         startTime: {name: 'StartTime'},
         endTime: {name: 'EndTime'}
      },
      dataSource: []
   };

   @Input() height: string = '650px';

   // 🔁 Optional filters and grouping
   @Input() filters: { label: string; value: string }[] = [];
   @Input() selectedFilter: string = '';
   @Output() selectedFilterChange = new EventEmitter<string>();

   @Input() resources: any[] = []; // array of resource definitions (e.g., employees)
   @Input() group: GroupModel | undefined; // Syncfusion group settings

   goPrev() {
      const newDate = new Date(this._selectedDate);
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
      const newDate = new Date(this._selectedDate);
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
      this.calendarViewChange.emit(this._calendarView);
   }

   onFilterChange(event: Event) {
      const target = event.target as HTMLSelectElement;
      this.selectedFilter = target.value;
      this.selectedFilterChange.emit(this.selectedFilter);
   }


   private updateDate(date: Date) {
      this._selectedDate = date;
      this.selectedDateChange.emit(this._selectedDate);
   }

   get isReadOnly(): boolean {
      return this.mode === 'context';
   }

   get allowInteraction(): boolean {
      return this.mode === 'dispatch';
   }

   get effectiveViews(): string[] {
      return this.mode === 'context'
         ? ['Day', 'Week']
         : this.views;
   }

   setEvents(events: CalendarEvent[]) {
      this.eventSettings = {
         ...this.eventSettings,
         dataSource: events
      };

      setTimeout(() => {
         this.scheduler.refreshEvents();
      });
   }

   onActionBegin(args: ActionEventArgs): void {
      if (args.requestType === 'eventCreate') {
         args.cancel = true; // STOP Syncfusion auto-save
         this.handleCreate(args);
      }

      if (args.requestType === 'eventChange') {
         args.cancel = true; // STOP auto-update
         this.handleUpdate(args);
      }
   }


   onActionComplete(args: ActionEventArgs): void {
      if (
         args.requestType === 'eventChange' ||
         args.requestType === 'eventResize' ||
         args.requestType === 'eventDrag'
      ) {
         const event = this.mapToCalendarEvent(args);
         if (event) {
            this.eventChange.emit(event);
         }
      }
   }

   private handleCreate(args: ActionEventArgs): void {
      const data = Array.isArray(args.data) ? args.data[0] : args.data;

      const event: CalendarEvent = {
         Subject: data.Subject,
         StartTime: new Date(data.StartTime),
         EndTime: new Date(data.EndTime),
         EntityType: ScheduleType.Exact,
      };

      this.eventCreate.emit(event);
   }

   private handleUpdate(args: ActionEventArgs): void {
      const data = Array.isArray(args.data) ? args.data[0] : args.data;

      const event: CalendarEvent = {
         Id: data.Id,
         Subject: data.Subject,
         StartTime: new Date(data.StartTime),
         EndTime: new Date(data.EndTime),
         EntityType: data.EntityType,
         EntityId: data.EntityId
      };

      this.eventChange.emit(event);
   }

   private mapToCalendarEvent(args: ActionEventArgs): CalendarEvent | null {
      const data = Array.isArray(args.data) ? args.data[0] : args.data;
      if (!data) return null;

      return {
         Id: data.Id,
         Subject: data.Subject,
         StartTime: new Date(data.StartTime),
         EndTime: new Date(data.EndTime),
         IsReadonly: data.IsReadonly ?? false,
         EntityType: data.EntityType,
         EntityId: data.EntityId
      };
   }

}
