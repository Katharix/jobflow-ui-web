import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

const STEP_COPY = [
  {
    title: 'Capture the request',
    description: 'Collect job details, photos, and scope in minutes from any device.'
  },
  {
    title: 'Schedule & dispatch',
    description: 'Assign the right crew, optimize routes, and keep everyone notified.'
  },
  {
    title: 'Deliver & update',
    description: 'Track progress, update customers, and close out work on site.'
  },
  {
    title: 'Invoice & collect',
    description: 'Send branded invoices and get paid faster with easy links.'
  }
];

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss'
})
export class HowItWorksComponent {
  steps = STEP_COPY;
}
