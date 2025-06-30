import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core'; // useful for typechecking
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { PageHeaderComponent } from "../../../dashboard/page-header/page-header.component";
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-employee-schedule',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, PageHeaderComponent],
  templateUrl: './employee-schedule.component.html',
  styleUrl: './employee-schedule.component.scss'
})
export class EmployeeScheduleComponent {
calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin ],
  themeSystem: 'bootstrap5',
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  selectable: true,
  editable: true,
  events: [
    {
      title: 'Lawn Job - Smith Residence',
      start: '2025-06-28T09:00:00',
      end: '2025-06-28T11:00:00',
      color: '#198754'
    }
  ],
  dateClick: this.handleDateClick.bind(this),
  eventClick: this.handleEventClick.bind(this)
};

  handleDateClick(arg: any) {
    console.log('Date clicked', arg);
    // TODO: Open modal to create a new job
  }

  handleEventClick(arg: any) {
    console.log('Event clicked', arg.event);
    // TODO: Open modal to view/edit job
  }
}
