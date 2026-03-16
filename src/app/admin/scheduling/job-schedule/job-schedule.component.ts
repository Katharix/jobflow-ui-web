import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { JobflowCalendarComponent } from '../../../common/jobflow-calendar/jobflow-calendar.component';
import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';


@Component({
  selector: 'app-job-schedule',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, JobflowCalendarComponent],
  templateUrl: './job-schedule.component.html',
  styleUrls: ['./job-schedule.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class JobScheduleComponent {
  selectedDate: Date = new Date();
  calendarView: string = 'Week';

  calendarEvents = {
    dataSource: [
      {
        Id: 1,
        Subject: 'Lawn Job - Smith Residence',
        StartTime: new Date('2025-07-05T09:00:00'),
        EndTime: new Date('2025-07-05T11:00:00'),
        CategoryColor: '#0d6efd'
      },
      {
        Id: 2,
        Subject: 'Power Wash - Matthews',
        StartTime: new Date('2025-07-06T12:00:00'),
        EndTime: new Date('2025-07-06T13:00:00'),
        CategoryColor: '#198754'
      }
    ]
  };


}
