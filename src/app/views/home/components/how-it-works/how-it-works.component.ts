
import { Component } from '@angular/core';

const STEP_COPY = [
  {
    title: 'Get the request',
    description: 'Client calls or submits a request. Create a job in seconds and add scope, photos, and crew details from any device.'
  },
  {
    title: 'Send a professional estimate',
    description: 'Share a public link. Clients accept or request changes with one click — no account, no friction, no phone tag.'
  },
  {
    title: 'Dispatch and execute',
    description: 'Crew sees the job on mobile the moment it\'s assigned. Track progress, log updates, and close out work on site.'
  },
  {
    title: 'Invoice and get paid',
    description: 'Convert to invoice in one click. Send a payment link by text or email. Stripe and Square accepted.'
  }
];

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss'
})
export class HowItWorksComponent {
  steps = STEP_COPY;
}
