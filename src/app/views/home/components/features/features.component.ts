import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { Feature } from '../types';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent {
  featuresRow1: Feature[] = [
    {
      title: 'Job Scheduling & Dispatch',
      imgSrc: '/assets/public/images/features/fea-1.png',
      icon: 'ti ti-calendar-event',
      description: 'Assign jobs, move crews, and track progress in real time — no whiteboard needed.'
    },
    {
      title: 'Estimates & Approvals',
      imgSrc: '/assets/public/images/features/fea-2.png',
      icon: 'ti ti-file-check',
      description: 'Clients accept or request revisions from a public link — no account required.'
    },
    {
      title: 'Invoices & Online Payments',
      imgSrc: '/assets/public/images/features/fea-3.png',
      icon: 'ti ti-receipt',
      description: 'Send a payment link by text or email. Clients pay online via Stripe or Square.'
    },
    {
      title: 'Client Hub',
      imgSrc: '/assets/public/images/features/fea-4.png',
      icon: 'ti ti-circle-dashed-user',
      description: 'A magic-link portal where clients view jobs, approve estimates, and pay — no login.'
    }
  ];

  featuresRow2: Feature[] = [
    {
      title: 'Crew Assignments',
      imgSrc: '/assets/public/images/features/fea-5.png',
      icon: 'ti ti-users',
      description: 'Drag-and-drop job assignments with conflict detection and travel time buffers.'
    },
    {
      title: 'Pricebook & Services',
      imgSrc: '/assets/public/images/features/fea-6.png',
      icon: 'ti ti-book-2',
      description: 'Build a service catalog with costs and prices so every estimate starts consistent.'
    },
    {
      title: 'Follow-Up Automation',
      imgSrc: '/assets/public/images/features/fea-7.png',
      icon: 'ti ti-refresh-dot',
      description: 'Multi-step email and SMS sequences that run automatically after estimates or invoices.'
    },
    {
      title: 'Business Insights',
      imgSrc: '/assets/public/images/features/fea-8.png',
      icon: 'ti ti-chart-bar',
      description: 'Track revenue, open invoices, and job completion rates across your whole operation.'
    }
  ];
}
