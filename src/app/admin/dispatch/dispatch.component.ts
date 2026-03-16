import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';

type DispatchStatus = 'Ready' | 'At Risk' | 'Delayed' | 'Done';

type DispatchPriority = 'Low' | 'Normal' | 'High';

interface DispatchTicket {
  id: string;
  customer: string;
  service: string;
  crew: string;
  timeWindow: string;
  priority: DispatchPriority;
  status: DispatchStatus;
}

@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './dispatch.component.html',
  styleUrl: './dispatch.component.scss'
})
export class DispatchComponent {
  readonly todaysDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  readonly openTickets = 14;
  readonly crewsOut = 6;
  readonly atRiskJobs = 3;
  readonly completedToday = 11;

  readonly tickets: DispatchTicket[] = [
    {
      id: 'DSP-2409',
      customer: 'Bluebird Realty',
      service: 'Exterior paint prep',
      crew: 'Crew A',
      timeWindow: '8:00 - 11:00',
      priority: 'High',
      status: 'At Risk'
    },
    {
      id: 'DSP-2411',
      customer: 'Glenwood HOA',
      service: 'Roof patch + seal',
      crew: 'Crew C',
      timeWindow: '10:30 - 1:30',
      priority: 'Normal',
      status: 'Ready'
    },
    {
      id: 'DSP-2414',
      customer: 'Northside Dental',
      service: 'Gutter cleanup',
      crew: 'Crew B',
      timeWindow: '1:00 - 3:00',
      priority: 'Low',
      status: 'Delayed'
    },
    {
      id: 'DSP-2416',
      customer: 'Weston Retail',
      service: 'Parking lot striping',
      crew: 'Crew D',
      timeWindow: '2:30 - 5:30',
      priority: 'Normal',
      status: 'Done'
    }
  ];

  readonly nextActions: string[] = [
    'Call Crew A to confirm weather backup plan',
    'Resequence DSP-2414 after traffic window',
    'Send completion SMS for Weston Retail'
  ];

  getStatusClass(status: DispatchStatus): string {
    switch (status) {
      case 'Ready':
        return 'dispatch-chip dispatch-chip--ready';
      case 'At Risk':
        return 'dispatch-chip dispatch-chip--risk';
      case 'Delayed':
        return 'dispatch-chip dispatch-chip--delayed';
      case 'Done':
        return 'dispatch-chip dispatch-chip--done';
      default:
        return 'dispatch-chip';
    }
  }

  getPriorityClass(priority: DispatchPriority): string {
    switch (priority) {
      case 'High':
        return 'dispatch-chip dispatch-chip--risk';
      case 'Normal':
        return 'dispatch-chip dispatch-chip--ready';
      case 'Low':
        return 'dispatch-chip dispatch-chip--done';
      default:
        return 'dispatch-chip';
    }
  }
}
