// job-schedule.component.ts
import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PageHeaderComponent} from '../../../views/admin-views/dashboard/page-header/page-header.component';
import {JobflowCalendarComponent} from '../../../common/jobflow-calendar/jobflow-calendar.component';
import {CalendarEvent} from '../../../common/jobflow-calendar/models/calendar-event';
import {AssignmentsService} from '../services/assignments.service';
import {mapAssignmentsToCalendarEvents} from '../../../common/jobflow-calendar/utils/assignment-calendar-mapper';
import {ScheduleType} from "../models/assignment";
import {ActivatedRoute} from "@angular/router";

@Component({
   selector: 'jobflow-schedule',
   standalone: true,
   imports: [CommonModule, PageHeaderComponent, JobflowCalendarComponent],
   templateUrl: './job-schedule.component.html'
})
export class JobScheduleComponent implements OnInit {
   @ViewChild(JobflowCalendarComponent)
   private calendar!: JobflowCalendarComponent;

   calendarEvents = {dataSource: [] as CalendarEvent[]};
   selectedDate = new Date();
   currentJobId!: string;
   jobTitle: string;
   clientName: string;

   eventSettings = {
      fields: {
         id: 'Id',
         subject: {name: 'Subject'},
         startTime: {name: 'StartTime'},
         endTime: {name: 'EndTime'}
      },
      dataSource: []
   };

   constructor(
      private assignments: AssignmentsService,
      private route: ActivatedRoute
   ) {
   }

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

      this.assignments.getAssignments(start, end).subscribe(assignments => {
         const clientJobInfo = assignments[0];
         this.jobTitle = clientJobInfo?.jobTitle;
         this.clientName = clientJobInfo.clientName;
         const events = mapAssignmentsToCalendarEvents(assignments);
         this.calendar.setEvents(events);
      });
   }

   /**
    * Fired when user clicks an empty time slot.
    * This should open a JobFlow modal to:
    * - select Job
    * - choose Exact vs Window
    * - confirm details
    */
   onCalendarEventCreate(e: CalendarEvent): void {
      this.assignments.createAssignment(this.currentJobId, {
         scheduledStart: e.StartTime,
         scheduledEnd: e.EndTime,
         scheduleType: ScheduleType.Exact
      }).subscribe(() => this.loadAssignments());
   }

   onCalendarEventUpdate(e: CalendarEvent): void {
      this.assignments.updateAssignmentSchedule(e.EntityId!, {
         scheduledStart: e.StartTime,
         scheduledEnd: e.EndTime,
         scheduleType: ScheduleType.Exact
      }).subscribe(() => this.loadAssignments());
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
   return new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 7
   );
}
