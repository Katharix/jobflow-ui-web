import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ScheduleModule,
  DayService,
  WeekService,
  WorkWeekService,
  MonthService,
  AgendaService
} from '@syncfusion/ej2-angular-schedule';
import { LucideAngularModule } from 'lucide-angular';
import { JobflowCalendarComponent } from '../../../common/jobflow-calendar/jobflow-calendar.component';
import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';


@Component({
  selector: 'app-job-schedule',
  standalone: true,
  imports: [FormsModule, CommonModule, PageHeaderComponent, ScheduleModule, LucideAngularModule, JobflowCalendarComponent],
  templateUrl: './job-schedule.component.html',
  styleUrls: ['./job-schedule.component.scss'],
  providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService],
  encapsulation: ViewEncapsulation.None
})
export class JobScheduleComponent {
constructor(
 private cdRef: ChangeDetectorRef
) {}
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
