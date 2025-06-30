import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from "../../../dashboard/page-header/page-header.component";
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core'; // useful for typechecking
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import interactionPlugin from '@fullcalendar/interaction';


@Component({
  selector: 'app-job-schedule',
  standalone: true,
  imports: [ FormsModule, CommonModule, PageHeaderComponent, FullCalendarModule ],
  templateUrl: './job-schedule.component.html',
  styleUrl: './job-schedule.component.scss'
})
export class JobScheduleComponent {
constructor(
 private cdRef: ChangeDetectorRef
) {}

@ViewChild(FullCalendarComponent) calendarComponent!: FullCalendarComponent;
currentDateLabel: string = '';

calendarView: string = 'timeGridWeek';
selectedEmployeeId: string = '';

employees = [
  { id: '1', name: 'Mike' },
  { id: '2', name: 'Sarah' },
  { id: '3', name: 'Deidre' }
];

calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin],
  themeSystem: 'bootstrap5',
  initialView: this.calendarView,
  headerToolbar: false, 
  datesSet: this.onDatesSet.bind(this),
  events: this.getFilteredEvents(),
  editable: true,
  selectable: true,
  eventClick: this.handleEventClick.bind(this),
  dateClick: this.handleDateClick.bind(this)
};

onDatesSet(arg: any): void {
  this.currentDateLabel = arg.view?.title ?? '';
  this.cdRef.detectChanges(); // Safely triggers re-check
}


updateCurrentDateLabel(): void {
  const calendarApi = this.calendarComponent.getApi();
  const view = calendarApi.view;

  // Use FullCalendar's built-in title (e.g. "Jun 30 – Jul 6, 2025")
  this.currentDateLabel = view.title;
}

getFilteredEvents(): EventInput[] {
  const allEvents = [
    {
      title: 'Lawn Job - Smith Residence',
      start: '2025-06-28T09:00:00',
      end: '2025-06-28T11:00:00',
      extendedProps: { employeeId: '2' },
      color: '#198754'
    },
    {
      title: 'Power Wash - Matthews',
      start: '2025-06-29T12:00:00',
      end: '2025-06-29T13:00:00',
      extendedProps: { employeeId: '1' },
      color: '#0d6efd'
    }
  ];

  return this.selectedEmployeeId
    ? allEvents.filter(e => e.extendedProps?.employeeId === this.selectedEmployeeId)
    : allEvents;
}

goNext(): void {
  this.calendarComponent.getApi().next();
  this.updateCurrentDateLabel();
}

goPrev(): void {
  this.calendarComponent.getApi().prev();
  this.updateCurrentDateLabel();
}

goToday(): void {
  this.calendarComponent.getApi().today();
  this.updateCurrentDateLabel();
}

changeView(): void {
  const calendarApi = this.calendarComponent.getApi();
  calendarApi.changeView(this.calendarView);
  this.updateCurrentDateLabel();
}

filterByEmployee(): void {
  this.calendarOptions.events = this.getFilteredEvents();
}


  handleDateClick(arg: any) {
    console.log('Date clicked', arg);
    // TODO: Open modal to create a new job
  }

  handleEventClick(arg: any) {
    console.log('Event clicked', arg.event);
    // TODO: Open modal to view/edit job
  }

}
